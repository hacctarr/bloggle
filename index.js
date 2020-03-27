const path = require('path')
const express = require('express')
const MongoClient = require('mongodb').MongoClient
const multer = require('multer')
const marked = require('marked')

const app = express()
const port = process.env.PORT || 3000
const dbName = process.env.NODE_ENV || 'dev'
const mongoURL = process.env.MONGO_URL || `mongodb://localhost:27017/${dbName}`

async function initMongo() {
  console.log('Initialising MongoDB...')
  let initialised = false
  while (!initialised) {
    try {
      client = await MongoClient.connect(mongoURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      initialised = true
    } catch {
      console.log('Error connecting to MongoDB, retrying in 1 second')
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  console.log('MongoDB initialised')
  return client.db(client.s.options.dbName).collection('blog')
}

async function start() {
  const db = await initMongo()

  app.set('view engine', 'pug')
  app.set('views', path.join(__dirname, 'views'))
  app.use(express.static(path.join(__dirname, 'public')))

  app.get('/', async (req, res) => {
    res.render('index', { title: 'My awesome blogging app', posts: await retrievePosts(db) })
  })

  app.get('/publish', async (req, res) => {
    res.render('publish', { title: 'Publish here', posts: await retrievePosts(db) })
  })

  app.get('/posts', async (req, res) => {
    res.send(await retrievePosts(db))
  })

  app.post(
    '/posts',
    multer({ dest: path.join(__dirname, 'public/uploads/'), preservePath: true }).single('image'),
    async (req, res) => {
      if (!req.body.upload && req.body.description) {
        await savePost(db, {
          description: req.body.description,
          date: new Date().toISOString()
            .replace(/T/, ' ')
            .replace(/\..+/, '')} )
        res.redirect('/publish')
      } else if (req.body.upload && req.file) {
        const link = `/uploads/${encodeURIComponent(req.file.filename)}`
        let md = `![](${link})`
        if (req.file.mimetype.split('/')[0] == 'video') {
          md = `<video width="320" height="200" controls=true><source src="${link}" type="${req.file.mimetype}"></video>`
        }
        res.render('publish', {
          title: 'Publish here', 
          content: `${req.body.description} ${md}`,
          posts: await retrievePosts(db),
        })
      }
    },
  )

  app.listen(port, () => {
    console.log(`App listening on http://localhost:${port}`)
  })

  app.emit("appStarted");
}

async function savePost(db, post) {
  await db.insertOne(post)
}

async function retrievePosts(db) {
  const posts = (await db.find().toArray()).reverse()
  return posts.map(it => {
    return { ...it, description: marked(it.description), date: it.date }
  })
}

start()
module.exports = app
