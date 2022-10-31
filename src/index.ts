const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
};

export interface Env {
    URLSTORE: KVNamespace,
}

interface URLSTORE_RESPONSE {
    code: string,
    url: string,
    urlstore: string,
}

const fixedLinks: any = {
    'favicon.ico': 'https://www.cloudflare.com/favicon.ico',
    'robots.txt': 'https://www.cloudflare.com/robots.txt',
    'auth': 'https://github.com/',
    'github': 'https://github.com/BRAVO68WEB/url-store-kv-worker',
    'bravo68web': 'https://itsmebravo.dev'
}

const fixedKeys : any = {
    'auth': "Don't be too smart",
    'health': 'OK',
    'help': 'https://github.com/BRAVO68WEB/url-store-kv-worker'
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const {headers, url, method} = request;
        const parsedURL = new URL(url);
        const {pathname} = parsedURL;
        const key = pathname.replace("/", "")

        switch (method) {
            case "POST":
                return this.handlePOST(request, env, parsedURL)
            case "GET":
                return this.handleGET(request, env, key)
        }

        return new Response("Hello World!");
    },

    async handlePOST(request: Request, env: Env, parsedURL: URL): Promise<Response> {
        const body: any = await request.json();
        const {protocol, hostname} = parsedURL
        let unique = false;
        let code = "";
		if(body.hasOwnProperty("auth")) {
			const { auth } = body
			const authKey = await env.URLSTORE.get("auth")
			if(auth !== authKey) {
				return new Response("Invalid auth", {status: 401})
			}
		}
		else {
			return new Response("Invalid auth", {status: 401})
		}
        if (body.hasOwnProperty('url')) {
            const {url} = body;
            while (!unique) {
                code = this.generateCode(7);
                const check = await env.URLSTORE.get(code);
                unique = !check;
            }
            const urlstore = `${protocol}//${hostname}/${code}`;
            await env.URLSTORE.put(code, url)
            const rData: URLSTORE_RESPONSE = {code, urlstore, url}

            return new Response(JSON.stringify(rData), {headers: corsHeaders});
        }
        return new Response(null, {status: 400})
    },

    async handleGET(request: Request, env: Env, key: string): Promise<Response> {
        let link: string | null = "";

        const authKey = await env.URLSTORE.get("auth")

        if(key in fixedKeys) {
            return new Response(fixedKeys[key])
        }
        else if(key == authKey){
			return new Response("Can you not !?", {status: 400})
        }
        else if(key in fixedLinks) {
            return Response.redirect(this.withHttps(fixedLinks[key]), 301);
        }
        else if(key) {
            link = await env.URLSTORE.get(key)
        }

        if(!link) {
            return new Response("Hmmmmmmm...", {status: 404})
        } else {
            return Response.redirect(this.withHttps(link));
        }
    },

    generateCode(length: number) {
        let result = '';
        let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },

    withHttps(url: string) : string{
        return !/^https?:\/\//i.test(url) ? `https://${url}` : url
    },
};
