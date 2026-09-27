import e from "express"

const app = e()

app.get('/',(req,res)=>{
    res.json({title: "first"}) 
})

app.listen(3000,()=>
    console.log("servers is runnign")
)