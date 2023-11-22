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


// const generateRandomCode = (name) => {
//   // Ensure the name is defined and at least 3 characters long
//   if (name && name.length >= 3) {
//     // Slice the first three letters of the name and convert to uppercase
//     const truncatedName = name.slice(0, 3).toUpperCase();

//     // Generate a random string of three numbers
//     const randomNumberString = Math.floor(Math.random() * 900) + 100;

//     return truncatedName + randomNumberString;
//   } else {
    
//     return "N/A"; 
//   }
// };

const lastRandomNumbers = {};

// Generate a constant product code
const generateConstantCode = (name) => {
  if (name && name.length >= 3) {
    const truncatedName = name.slice(0, 3).toUpperCase();

    // Check if a random number has been generated for this product
    let randomNumberString = lastRandomNumbers[name];

    if (!randomNumberString) {
      // If not, generate a random string of three numbers
      randomNumberString = Math.floor(Math.random() * 900) + 100;

      // Store the random number for this product in memory
      lastRandomNumbers[name] = randomNumberString;
    }

    return truncatedName + randomNumberString;
  } else {
    return "N/A";
  }
};



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    
    const productCollection = client.db('productDB').collection('products');

    //search
  app.get('/search', async (req, res) => {
    try {
      const searchText = req.query.text;
      // Assuming you have a field named 'productLink' in your documents, replace it with the actual field name
      const result = await productCollection.find({ $or: [{ productCode: { $regex: searchText, $options: 'i' } }] }).toArray();
  
      if (result.length > 0) {
        // Send the product link in the response
        res.json({ productLink: result[0].productLink });
      } else {
        // If the product code is not found, you can send an appropriate response
        res.json({ error: 'Product code not found' });
      }
    } catch (error) {
      console.error('Search Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  


  app.post('/addproduct', async (req, res) => {
    const product = req.body;
  
    // Generate product code
    const productCode = generateConstantCode(product.name);
  
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


  app.post('/allproducts', async(req, res) =>{
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

