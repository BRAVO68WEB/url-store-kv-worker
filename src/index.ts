import { Hono, Context } from 'hono';
import { cors } from 'hono/cors';
import { showRoutes } from 'hono/dev'
import { poweredBy } from 'hono/powered-by'
import { prettyJSON } from 'hono/pretty-json';

type Env = {
    URLSTORE: KVNamespace,
    URLSTOREDB: D1Database
}

interface URLSTORE_RESPONSE {
    code: string,
    url: string,
}

const fixedLinks: any = {
    'favicon.ico': 'https://www.cloudflare.com/favicon.ico',
    'robots.txt': 'https://www.cloudflare.com/robots.txt',
    'auth': 'https://github.com/',
    'bravo68web': 'https://itsmebravo.dev'
}

const fixedKeys : any = {
    'auth': "Don't be too smart",
    'health': 'OK',
}

const generateCode = (length: number) => {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const withHttps = (url: string) : string => {
    return !/^https?:\/\//i.test(url) ? `https://${url}` : url
}

const app = new Hono<{
    Bindings: Env
}>();

app.use(cors());
app.use(poweredBy());
app.use(prettyJSON())

app.get('/', async (c: Context) => {
    return c.json({
        message: "Welcome to URL Store",
        github: "https://github.com/BRAVO68WEB/url-store-kv-worker/"
    })
})

app.get('/stats', async (c: Context) => {
    const total_keys = await c.env.URLSTORE.list();
    const total_views = await c.env.URLSTOREDB.prepare(
        "SELECT SUM(count) as total FROM views"
        )
        .all() as any;

    return c.json({
        total_keys: total_keys.keys.length,
        total_views: total_views.results[0].total
    });
})

app.get('/health', async (c: Context) => {
    return c.text("OK")
})

app.get('/list/keys', async (c: Context) => {
    const auth = c.req.header('X-Auth-Key')
    const authKey = await c.env.URLSTORE.get("auth")

    if(auth !== authKey) {
        return new Response("Invalid auth", {status: 401})
    }

    const keys = await c.env.URLSTORE.list()
    return c.json(keys)
})

app.get('/:key', async (c: Context) => {
    let link: string | null = "";
    const key = c.req.param('key');

    const authKey = await c.env.URLSTORE.get("auth")

    if(key in fixedKeys) {
        return c.text(fixedKeys[key])
    }
    else if(key == authKey){
        return c.text("Can you not !?", 400)
    }
    else if(key in fixedLinks) {
        return c.redirect(fixedLinks[key], 301)
    }
    else if(key) {
        link = await c.env.URLSTORE.get(key)
    }

    if(!link) {
        return c.text("Hmmmmmmm...", 404)
    } else {
        const { results } = await c.env.URLSTOREDB.prepare(
            "SELECT * FROM views WHERE linkid = ?"
            )
            .bind(key)
            .all() as any;

        if(results.length) {
            await c.env.URLSTOREDB.prepare(
                "UPDATE views SET count = count + 1 WHERE linkid = ?"
                )
                .bind(key)
                .run();

            await c.env.URLSTOREDB.prepare(
                "UPDATE views SET updated_at = ? WHERE linkid = ?"
                )
                .bind(new Date().toISOString(), key)
                .run();
        }
        else {
            await c.env.URLSTOREDB.prepare(
                "INSERT INTO views (linkid, count, updated_at) VALUES (?, ?, ?)"
                )
                .bind(key, 1, new Date().toISOString())
                .run();
        }
        
        return c.redirect(withHttps(link), 301)
    }
})

app.delete('/:key', async (c: Context) => {
    const auth = c.req.header('X-Auth-Key')
    const authKey = await c.env.URLSTORE.get("auth")

    if(auth !== authKey) {
        return new Response("Invalid auth", {status: 401})
    }

    const qkey = c.req.param('key')

    await c.env.URLSTORE.delete(
        qkey
    )

    return c.json({
        message: "Deleted"
    })
})

app.get('/view/:key', async (c: Context) => {
    const auth = c.req.header('X-Auth-Key')
    const authKey = await c.env.URLSTORE.get("auth")
    const qkey = c.req.param('key')

    if(auth !== authKey) {
        return new Response("Invalid auth", {status: 401})
    }

    const { results } = await c.env.URLSTOREDB.prepare(
        "SELECT * FROM views WHERE linkid = ?"
        )
        .bind(qkey)
        .all() as any;

    const value = await c.env.URLSTORE.get(
        qkey
    )

    if(!value) {
        return c.json({
            error: "Invalid key"
        }, 400);
    }

    return c.json({
        results,
        value
    })
})

app.post('/create', async (c: Context) => {
    const body = await c.req.json();
    let unique = false;
    let code = "";
    const auth = c.req.header('X-Auth-Key')
    if(auth) {
        const authKey = await c.env.URLSTORE.get("auth")
        if(auth !== authKey) {
            return c.json({
                error: "Invalid auth"
            }, 401)
        }
    }
    else {
        return c.json({
            error: "Invalid auth"
        }, 401)
    }
    if (body.url) {
        const {url, key} = body;
        while (!unique) {
            code = generateCode(7);
            const check = await c.env.URLSTORE.get(code);
            unique = !check;
        }
        if(key){
            code = key
        }

        await c.env.URLSTORE.put(code, url)
        const rData: URLSTORE_RESPONSE = {
            code, 
            url
        }

        return c.json(rData)
    }

    return c.json({
        error: "Invalid request"
    }, 400)
})

showRoutes(app)

export default app