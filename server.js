// server.js

import Koa from 'koa';
import Router from '@koa/router';
import serve from 'koa-static';
import cors from '@koa/cors';
import compress from 'koa-compress'
import zlib from 'zlib'

const app = new Koa();
const router = new Router();

// 添加跨域支持
app.use(cors());


// 配置压缩中间件
app.use(compress({
    filter(content_type) {
        console.log(content_type, /text|javascript|json|css/.test(content_type));
        // 只有当内容类型匹配时才启用压缩
        return /text|javascript|json|css/.test(content_type)
    },
    threshold: 2048, // 只压缩大于这个字节数的响应体
    gzip: {
        flush: zlib.constants.Z_SYNC_FLUSH
    },
    deflate: {
        flush: zlib.constants.Z_SYNC_FLUSH,
    },
    br: false // 禁用brotli压缩，因为Node.js可能不支持
}));

// 设置静态资源目录，并设置缓存控制最大时长（例如一年，单位是毫秒）
app.use(serve('build', {
    // maxage: 365 * 24 * 60 * 60 * 1000 // 一年
}));

// 添加请求日志和执行时间中间件
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});


app.use(router.routes());
app.use(router.allowedMethods());

const PORT = process.env.PORT || 9999;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
