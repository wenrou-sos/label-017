import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js'

import authRoutes from './routes/auth.routes.js'
import productsRoutes from './routes/products.routes.js'
import machinesRoutes from './routes/machines.routes.js'
import ordersRoutes from './routes/orders.routes.js'
import schedulesRoutes from './routes/schedules.routes.js'
import usersRoutes from './routes/users.routes.js'
import logsRoutes from './routes/logs.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/machines', machinesRoutes)
app.use('/api/orders', ordersRoutes)
app.use('/api/schedules', schedulesRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/logs', logsRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use(errorHandler)
app.use(notFoundHandler)

export default app
