const fetch = require("node-superfetch")

const images = []
const newImages = []
const failedPages = []

let beforeCount = 0

const express = require("express")
const app = express()
const cors = require('cors')

app.use(cors())
app.use(express.urlencoded({ extended: true }));
app.use(express.json({
    type: ['application/json', 'text/plain']
}))


let port = 4000

app.get("/", async (req,res) => {
    res.send("200")
})

app.post("/rule34", async (req,res) => {
    let url = req.body.url
    let maxCount = req.body.maxCount

    if(!maxCount || typeof maxCount !== 'number') maxCount = null
    if((await checkURL(url)) === false) return res.json({ success: false , msg: "invalid url" })

    async function checkURL(url){
        let response = (await fetch.get(url)).body.toString()
        if(response.includes("but us chickens")){
            return false
        } else {
            return true
        }
    }

    async function getImages(pid){
        if(pid !== 0) url = `${url}&pid=${42 * pid}`
    
        let body = (await fetch.get(url)).body.toString()
    
        if(body.length === 0){
            return false
        } else {
            for(const string of body.split(/ +/g)){
                if(/index.php\?page=post&s=view&id=[0-9]+/.test(string)){
                    images.push(`https://rule34.xxx/${string.replace(/"/g,'').replace("href=","")}`)
                }
            }
    
            return true
        }
    }
    
    async function fetchPage(url,page){
        let body = (await fetch.get(url)).body.toString()
        let i = 0
    
        for(const arg of body.split(/ +/g)){
            if(/https:\/\/wimg.rule34.xxx\/\/samples\/[0-9]+\/sample_[0-9a-zA-Z]+.(jpg|png|jpeg|webp)\?[0-9]+/.test(arg)){
                console.log({
                    url: arg.replace("src=","").replace(/"/g,""),
                    status: "success",
                    page: page
                })
    
                newImages.push(arg.replace("src=","").replace(/"/g,""))
            }
    
            i = i + 1
            if(i === body.split(/ +/g).length){
                failedPages.push({
                    url: url,
                    status: "failed"
                })
            }
        }
    }
    
    let nextPage = true
    let i = 0

    while(nextPage){
        if(beforeCount === images.length && beforeCount !== 0){
            nextPage = false
            break
        } else {
            beforeCount = images.length
            nextPage = await getImages(i)
            i = i + 1
        }
    }

    let fetchedPages = 0
    for(const image of images){
        await fetchPage(image,fetchedPages)
        fetchedPages = fetchedPages + 1
    }

    res.json({ images: newImages })
})

app.listen(port,function(){
    console.log("Backend is online")
})