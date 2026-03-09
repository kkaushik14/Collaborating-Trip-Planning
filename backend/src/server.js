import { app } from './app.js'
import { connectDatabase, env } from './config/index.js'

const startServer = async () => {
  try {
    await connectDatabase()

    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`)
    })
  } catch (error) {
    console.error('Unable to start backend:', error.message)
    process.exit(1)
  }
}

startServer()
