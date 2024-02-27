import { Button, Checkbox, IconButton, ThemeProvider, createTheme } from '@mui/material';
import { PlayCircle, LightMode, DarkMode } from '@mui/icons-material';
import crypto from 'crypto-js';

import './App.css';
import { useState } from 'react';
import React from 'react'

const config = Object.assign({
    dark: false,

    wordsData: [],

    currentPage: 0,
    wordIndex: 0,
    wordMask: false,
}, JSON.parse(localStorage.getItem('config') || '{}'));

const res = await fetch('/words.txt');
const txt = await res.text();
const data_md5 = crypto.MD5(txt).toString();

if (data_md5 !== config.data_md5) {
    let currentRoot = '';
    let cache = {};

    for (const line of txt.split('\n')) {
        if (!line) continue;

        if (line.includes('|')) {
            currentRoot = line;
            cache[currentRoot] = [];
        } else {
            cache[currentRoot].push(line.split(','));
        }
    }

    config.wordsData = [];

    for (const root of Object.keys(cache)) {
        config.wordsData.push({
            root,
            data: cache[root]
        });
    }

    cache = null;
    config.data_md5 = data_md5;
    localStorage.setItem('config', JSON.stringify(config));
}

let currentAudio = new Audio();

function playAudio(word) {
    const url = `https://dict.youdao.com/dictvoice?audio=${word}&type=1`;

    if (!currentAudio.paused) {
        currentAudio.pause();
        currentAudio.currentTime = 0; // 重置音频时间，以便下次可以重新开始播放
    }

    currentAudio.src = url;
    currentAudio.play();
}


// Helper function to highlight base words within a string
const highlightBaseWordsInString = (text, baseWords, className) => {
    let lastIndex = 0;
    const elements = [];
    for (const baseWord of baseWords) {
        let index = text.indexOf(baseWord, lastIndex);
        while (index !== -1) {
            if (index > lastIndex) {
                elements.push(text.slice(lastIndex, index));
            }
            elements.push(<span key={`${baseWord}-${index}`} className={className}>{baseWord}</span>);
            lastIndex = index + baseWord.length;
            index = text.indexOf(baseWord, lastIndex);
        }
    }
    if (lastIndex < text.length) {
        elements.push(text.slice(lastIndex));
    }
    return elements;
};

// Helper function to recursively highlight base words within an element
const highlightBaseWordsInElement = (element, baseWords, className) => {
    if (typeof element === 'string') {
        return highlightBaseWordsInString(element, baseWords, className);
    } else if (React.isValidElement(element) && element.props.children) {
        const children = React.Children.map(element.props.children, child =>
            highlightBaseWordsInElement(child, baseWords, className)
        );
        return React.cloneElement(element, { ...element.props, key: element.key }, children);
    }
    return element;
};

// Helper function to create React elements with highlighted words
const createHighlightedElements = (text, words, baseWords) => {
    let elements = [text];
    words.forEach(word => {
        elements = elements.map(element =>
            typeof element === 'string'
                ? highlightBaseWordsInString(element, [word], 'highlight-word')
                : highlightBaseWordsInElement(element, [word], 'highlight-word')
        ).flat();
    });
    return elements;
};

// The main function to highlight words
const highlightWord = (word, words, baseWords) => {
    // Sort words and baseWords by length in descending order
    const sortedWords = [...words].sort((a, b) => b.length - a.length);
    const sortedBaseWords = [...baseWords].sort((a, b) => b.length - a.length);

    sortedWords.splice(sortedWords.indexOf(word), 1);

    // Create highlighted elements for words
    let elements = createHighlightedElements(word, sortedWords, sortedBaseWords);

    // Highlight base words within the elements
    elements = elements.map(element => highlightBaseWordsInElement(element, sortedBaseWords, 'highlight-base'));

    return elements;
};



function App() {
    const [, updateApp] = useState(null);

    const setConfig = (name, value) => {
        if (name) {
            config[name] = value;
        }

        localStorage.setItem('config', JSON.stringify(config));
        updateApp(Date.now());
    }

    const handle_reset = () => {
        config.wordsData.sort(() => Math.random() - 0.5);

        config.currentPage = 0;
        config.wordIndex = 0;
        config.wordMask = false;

        setConfig();
    }

    let { currentPage, wordsData } = config;
    const { root, data } = wordsData[currentPage] || { root: '', data: [] };

    // 从root中取出|前面的数据，并分割成数组
    const baseWords = root.split('|')[0].split(',');

    const words = data.map(word => word[0]);

    function playWordAudio() {
        let { currentPage, wordsData, wordIndex } = config;
        const { data } = wordsData[currentPage] || { root: '', data: [] };

        const word = data[wordIndex];
        if (word) playAudio(word[0]);
    }

    const nextAction = () => {
        // if (config.wordIndex === -1) {
        //     config.wordIndex = 0;
        // } else {
        //     config.wordIndex++;
        // }

        // if (!wordList[config.wordIndex]) {
        //     const oldData = config.wordsData[config.wordsName].concat([]);
        //     const index1 = Array.from({ length: endIndex - startIndex }, (v, k) => k + startIndex);
        //     const index2 = index1.concat([]).sort(() => Math.random() - 0.5);

        //     for (let i = 0; i < index1.length; i++) {
        //         const i1 = index1[i];
        //         const i2 = index2[i];
        //         config.wordsData[config.wordsName][i1] = oldData[i2];
        //     }

        //     config.wordIndex = 0;
        // }

        // setConfig();
        // playWordAudio();
    }

    const nextPage = () => {
        config.currentPage++;
        config.wordIndex = 0;
        config.wordMask = false;
        if (config.currentPage > config.wordsData.length) config.currentPage = config.wordsData.length;
        setConfig();
        playWordAudio();
    }

    const prevPage = () => {
        config.currentPage--;
        config.wordIndex = 0;
        config.wordMask = false;
        if (config.currentPage < 1) config.currentPage = 1;
        setConfig();
        playWordAudio();
    }

    const darkMode = () => {
        setConfig('dark', !config.dark);
    }

    const darkTheme = createTheme({
        palette: {
            mode: config.dark ? 'dark' : 'light',
        },
    });

    return (
        <ThemeProvider theme={darkTheme}>
            <div className={"app " + (config.dark ? 'dark' : '')}>
                <header>
                    <Button size="small" onClick={handle_reset}>reset</Button>

                    <span >
                        <span>{0}/{0}</span>
                    </span>

                    <IconButton size="small" onClick={darkMode} className="darkMode">
                        {!config.dark ? <DarkMode size="small" /> : <LightMode size="small" />}
                    </IconButton>
                </header>

                <p className="root">{root.replace('|', ' ')}</p>

                <div className="table-box">

                    <div onClick={nextAction} style={{ width: '100%' }}>
                        <table className={config.wordMask ? 'mask' : ''}>
                            {data.map((word, i) => (
                                <tr
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        config.wordIndex = i;
                                        playWordAudio();
                                        setConfig();
                                    }}
                                    key={"wordli" + word[0]}
                                    className={i === config.wordIndex ? 'selectd' : ''}>
                                    <td className='word word0'>{highlightWord(word[0], words, baseWords)}</td>
                                    <td className='word word1'>[{word[1]}]</td>
                                    <td className='word word2'>{word[2]}</td>
                                </tr>
                            ))}
                        </table>
                    </div>
                </div>

                <footer>
                    <IconButton
                        onClick={playWordAudio}
                        size="small">
                        <PlayCircle fontSize="small" />
                    </IconButton>

                    <div>
                        <Button size="small" onClick={prevPage}>prev</Button>
                        <Button size="small" onClick={nextPage}>next</Button>
                    </div>

                    <Checkbox checked={config.wordMask}
                        onChange={e => setConfig('wordMask', e.target.checked)} />
                </footer>
            </div>
        </ThemeProvider>
    );
}

export default App;
