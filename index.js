const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zvmk2.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// ... (previous code)

// Define the generateRandomCode function on the server side
const generateRandomCode = (name) => {
  // Ensure the name is defined and at least 3 characters long
  if (name && name.length >= 3) {
    // Slice the first three letters of the name and convert to uppercase
    const truncatedName = name.slice(0, 3).toUpperCase();

    // Generate a random string of three numbers
    const randomNumberString = Math.floor(Math.random() * 900) + 100;

    return truncatedName + randomNumberString;
  } else {
    // Handle the case where name is undefined or too short
    return "N/A"; // Or any default value you want
  }
};

// ... (remaining code)


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    
    const productCollection = client.db('productDB').collection('products');

    const indexKey = {name: 1, sellerName: 1};
    const indexOptions = {multipleFinding: "webfinding"};

  //search
  // app.get('/search/:text',async(req,res)=>{
  //   const searchText=req.params.text;
  //   const result=await productCollection.find({$or:[{productname:{$regex:searchText,$options:"i"}}]}).toArray();
  //   res.send(result);
  // })

  app.get('/search', async (req, res) => {
    const searchText = req.query.text;
    const result = await productCollection.find({ $or: [{ productname: { $regex: searchText, $options: 'i' } }] }).toArray();
    res.send(result);
  });
  

//add product
  //   app.post('/addproduct',async(req,res)=>{
  //     const product=req.body;
  //     const result=await productCollection.insertOne(product);
  //     res.send(result);
  //     console.log(product);
  // })
  app.post('/addproduct', async (req, res) => {
    const product = req.body;
  
    // Generate product code
    const productCode = generateRandomCode(product.name);
    
    // Add the product code to the product object
    product.productCode = productCode;
  
    try {
      // Insert the product into the collection
      const result = await productCollection.insertOne(product);
      
      // Check if the product was inserted successfully
      if (result.insertedCount > 0) {
        res.send({ success: true, productCode: productCode });
      } else {
        res.status(500).send({ success: false, error: 'Failed to insert product' });
      }
    } catch (error) {
      console.error('Add Product Error:', error);
      res.status(500).send({ success: false, error: 'Internal Server Error' });
    }
  });

  app.get('/addproduct', async(req, res) =>{
    const cursor = productCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  })

  //all

  app.get('/allproducts', async (req,res)=>{
    console.log(req.query.email);
    let query = {};
    if(req.query?.email){
      query = {email: req.query.email}
    }
    const result = await productCollection.find(query).toArray();
    res.send(result);
  })


  app.post('allproducts', async(req, res) =>{
    const product = req.body;
    console.log(product);
    const result = await productCollection.insertOne(product);
    res.send(result);
  })

  app.get('/allproducts/:id',async(req,res)=>{
    const id = req.params.id;
    console.log(id);
    const result = await productCollection.findOne({_id:new ObjectId(id)});
    res.send(result);
    console.log(result);
  });

  //new
  app.get('/dashboard', async (req, res) => {
    console.log(req.query?.email);
    let query = {}; // Initialize the query object
    if (req.query?.name) {
      query = { sellerEmail: req.query.email };
    }
    const result = await productCollection.find(query).toArray();
    res.send(result);
  });

  app.get('/dashboard/:email',async(req,res)=>{
    console.log(req.params.email);
    const result=await productCollection.find({sellerEmail:req.params.email}).sort({price:-1}).toArray();
    console.log(result); // Log the result
    res.send(result);
  });

  // app.delete('/allproducts/:email',async(req,res)=>{
  //   const id = req.params.id;
  //   const result = await productCollection.deleteOne({_id:new ObjectId(id)});
  //   res.send(result);
  // });
  app.delete('/allproducts/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const result = await productCollection.deleteOne({ _id: new ObjectId(id) });
      console.log('Delete Result:', result);
      res.send(result);
    } catch (error) {
      console.error('Delete Error:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) =>{
    res.send('StoreCode is running')
})

app.listen(port, () =>{
    console.log(`StoreCode is running on port ${port}`)
})

