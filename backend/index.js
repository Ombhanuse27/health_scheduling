const express=require('express');
const mongoose=require('mongoose');
const dotenv=require('dotenv');

const app=express();


app.use(express.json());
dotenv.config();    

app.get('/',(req,res)=>{
    res.send('Hello World');
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));