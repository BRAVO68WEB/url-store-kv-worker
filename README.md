# CF KV Workers 🚀

Just another custom URL store made with CloudFlare Workers and KV.

## Feature Overview 

- KV for Slug and Link storage
- D1 for View count tracking
- Workers for Deployment

## How to use?

1. Clone the repo and head inside it
```bash
git clone https://github.com/BRAVO68WEB/url-store-kv-worker
cd url-store-kv-worker
```

2. Install all dependencies
```bash
pnpm i
```

3. Login to wrangler cli, if not done
```bash
pnpm wrangler login
```

4. Handle KV Namespace
```bash
pnpm wrangler kv:namespace create you_pref_kv_name
```

> { binding = "you_pref_kv_name", id = "xxxxxxxxxxxxxxxxxxxxxxxxxx" }

Replace existing id with this id `xxxxxxxxxxxxxxxxxxxxxxxxxx` in wrangler.toml file

```bash
pnpm wrangler kv:namespace create you_pref_kv_name_preview
```

> { binding = "you_pref_kv_name_preview", id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyy" }

Replace existing preview_id with this id `yyyyyyyyyyyyyyyyyyyyyyyyyyyyyy` in wrangler.toml file

Finally, it should look like

```toml
kv_namespaces = [
  { binding = "URLSTORE", preview_id = "yyyyyyyyyyyyyyyyyyyyyyyyyyyyyy", id = "xxxxxxxxxxxxxxxxxxxxxxxxxx" }
]
```

5. Handle D1 Database
```bash
pnpm wrangler d1 create you_pref_db_name
```

Output :-
```toml
[[ d1_databases ]]
binding = "DB" # i.e. available in your Worker on env.DB
database_name = "you_pref_db_name"
database_id = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"
```

Replace existing database_id with this id `wwwwwwwwwwwwwwwwwwwwwwwwwwwwww` in wrangler.toml file
Replace existing database_name with this id `you_pref_db_name` in wrangler.toml file

```bash
pnpm wrangler d1 create you_pref_db_name_preview
```

Output :-
```toml
[[ d1_databases ]]
binding = "DB" # i.e. available in your Worker on env.DB
database_name = "you_pref_db_name_preview"
database_id = "wwwwwwwwwwwwwwwwwwwwwwwwwwwwww"
```

Replace existing preview_database_id with this id `wwwwwwwwwwwwwwwwwwwwwwwwwwwwww` in wrangler.toml file

6. Perform SQL table migrations

```bash
pnpm wrangler d1 execute URLSTORE --file=./schema.sql
```

7. Test locally, to see if the config works

```bash
pnpm start
```

8. Deploy to Cloudflare Workers

```bash
pnpm run deploy
```

Happy Hacking 🎉 !!