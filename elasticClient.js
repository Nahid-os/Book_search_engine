// elasticClient.js : Initializes and configures the Elasticsearch client instance.
const { Client } = require('@elastic/elasticsearch');

const client = new Client({
  node: 'https://localhost:9200',
  auth: {
    username: 'elastic',  
    password: '_9XbnnrnmDeM2tKp2UNV'
  },
  tls: {
    rejectUnauthorized: false // For development only; 
  }
});

module.exports = client;
