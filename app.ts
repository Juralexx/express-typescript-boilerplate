import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import { rateLimit } from 'express-rate-limit'
import compression from 'compression'
import dotenv from 'dotenv'
dotenv.config({ path: './.env' })
import path from 'path'
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

const FRONT_URL = process.env.NODE_ENV !== 'production' ? process.env.DEV_FRONT_URL : process.env.FRONT_URL

app.use(cors({
    'credentials': true,
    'origin': FRONT_URL,
    'allowedHeaders': ['Content-Length', 'Content-Type', 'application', 'Authorization'],
    'methods': 'GET, PUT, POST, DELETE',
    'preflightContinue': false,
}))

app.use(helmet({
    crossOriginEmbedderPolicy: false,
    // crossOriginResourcePolicy: false,
    crossOriginResourcePolicy: {
        policy: 'cross-origin'
    },
    originAgentCluster: true,
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            "img-src": ["'self'", "https: data:"],
            "default-src": ["*"]
        }
    }
}));
app.use(express.json({ limit: '15kb' }))
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '15kb'
}))
app.use(bodyParser.json({ limit: '15kb' }))

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too Many Request from this IP, your IP has been blocked. Please try again later.'
})

app.use(limiter)
app.use(compression())

const router = express.Router()

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, `./build/`)))

    router.get('/', (_, res: Response) => {
        res.sendFile(path.join(__dirname, 'index.html'))
    });
}

app.use('/', router)

if (process.env.NODE_ENV !== 'production') {
    process.once('uncaughtException', err => {
        console.error(err.stack || err)
        setTimeout(() => process.exit(1), 100)
    })
}

const PORT = process.env.PORT || 5001

app.listen(PORT, () => {
    console.log(`Serveur démarré : http://localhost:${PORT}`)
})