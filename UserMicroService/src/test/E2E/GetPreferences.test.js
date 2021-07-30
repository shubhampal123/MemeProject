const request = require('supertest');
const app = require("../../server") ;
const { UserMeme, UserCategory, db } = require('../../models');

describe('Get User preferences',()=>{
    beforeAll( async () => {
        await db.sync();
    });
    const userId="43f75d5470b258bba1ba1e7a0c1eb734289a50cc" ;
    const memeId="123" ;
    xit('should get list of UserCategories id', async() => {
        const res = await request(app)
        .get(`/api/userCategories/${userId}`)
        expect(res.statusCode).toEqual(200) ;
        expect(res.body.data.userCategories).not.toBeNull();
    });

    xit('should get list of UserMeme ids', async ()=>{
        const res = await request(app)
        .get(`/api/favMemes/${userId}`)
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.favMemes).not.toBeNull();
    });
});

describe("User Meme Likeness", () => {
    beforeAll(async() => {
        await db.sync();
    });
    const userId="43f75d5470b258bba1ba1e7a0c1eb734289a50cc" ;
    const memeId="123";
    xit('should get memeLikeness', async ()=>{
        const res = await request(app)
        .get(`/api/memeLikeness/${userId}/${memeId}`)
        expect(res.statusCode).toEqual(200);
        expect(res.body.data.memeLikeness).toEqual(13);
    });
});