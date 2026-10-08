const { Client } = require("pg");
const c = new Client({
    connectionString:
        "postgresql://neondb_owner:npg_LN0ftGd1zEap@ep-raspy-shape-aohz6a4i-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
});
c.connect()
    .then(() => c.query("SELECT created_at, video_path FROM _media ORDER BY created_at DESC LIMIT 5"))
    .then((r) => {
        console.log(JSON.stringify(r.rows, null, 2));
        process.exit(0);
    });
