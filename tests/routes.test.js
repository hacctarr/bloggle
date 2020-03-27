const request = require('supertest')
const app = require('../index')

beforeAll(function (done) {
    app.on("appStarted", done)
})

describe('Post Endpoints', () => {
    it('should create a new post', async () => {
        const res = await request(app)
        .post('/posts')
        .field('description', 'testing is fun')
        expect(res.statusCode).toEqual(302)
    })
})
  
describe('Get posts', () => {
    it('should find the new post', async () => {
        const res = await request(app)
        .get('/')
        .expect(200)
    })
  })

describe('Get posts', () => {
    it('should find the new post', async () => {
        const res = await request(app)
        .get('/posts')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
    })
})
