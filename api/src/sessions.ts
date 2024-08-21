import session from "express-session";
import RedisStore from "connect-redis";
import { createClient } from "redis";

export async function init_session(app: any): Promise<RedisStore> {
	const client = createClient({ url: "redis://sessions-database" });
	client.on('error', err => console.log('Redis client error: ', err));
	await client.connect();
	const store = new RedisStore({client: client});
	app.use(session({
		secret: 'some secret',
		saveUninitialized: true,
		resave: false,
		store: store,
	}));
	return store;
}

