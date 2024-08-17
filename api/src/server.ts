import express, { NextFunction, Request, Response } from "express";
import session from "express-session";
import chalk from "chalk";
import { createServer } from "http";
import { NotFoundError } from "./types/types.js";
import { addRoutes, basePath } from "./routes/routes.js";
import { uploadPath } from "./uploads.js";
import { _getReqPath } from "./utils.js";
import { init_keycloak, keycloak } from "./auth.js";
import { startAllTriggers } from "./triggers/triggers.js";
import { addWebsockets } from "./websockets.js";

const port = 3000;
const app = express();
const server = createServer(app);

app.use(express.json());  // otherwise req.body is undefined


// store
// --------------------------------------------
const memoryStore = new session.MemoryStore();
app.use(session({
	secret: 'some secret',
	saveUninitialized: true,
	resave: false,
	store: memoryStore,
}));


// authentication
// ----------------------------------------------
init_keycloak(memoryStore);
app.use(keycloak.middleware());


// routes
// ----------------------------------------------
const router = express.Router();
router.use("/uploads", express.static(uploadPath));
addRoutes(router);
app.use(basePath, router);


// websockets
// ----------------------------------------------
addWebsockets(server);


// triggers
// ----------------------------------------------
startAllTriggers();


// error handling
// ----------------------------------------------
app.use(_errorHandler);

server.listen(port, () => {
	console.log(`Listening on port ${port}`);
	console.log(`\n`);
});


// private
// ----------------------------------------------
function _errorHandler(err: Error, req: Request, res: Response, _: NextFunction) {
	console.error(chalk.red(`⚠️ ⚠️ ⚠️ ERROR AT ${new Date()}`));
	console.error(`------------------------------`);
	console.error(`REQUEST DETAILS`);
	console.error(`------------------------------`);
	console.error(`method : ${req.method}`);
	console.error(`url    : ${req.originalUrl}`);
	console.error(`body   : ${JSON.stringify(req.body)}`);
	console.error(chalk.gray(`headers: ${JSON.stringify(req.headers)}`));
	console.error(`------------------------------`);
	console.error(`ERROR MESSAGE`);
	console.error(`------------------------------`);
	console.error(err);
	console.error(`\n\n`);
	if (err instanceof NotFoundError) {
		res.status(404).send();
	} else {
		res.status(500).send();
	}
}
