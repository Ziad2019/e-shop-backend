import axios from 'axios'

const brands = [
  { name: 'Apple',   image: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
  { name: 'Samsung', image: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg' },
  { name: 'Nike',    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
  { name: 'Adidas',  image: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
  { name: 'Sony',    image: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg' },
  { name: 'LG',      image: 'https://upload.wikimedia.org/wikipedia/commons/2/20/LG_symbol.svg' },
  { name: 'Zara',    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Zara_Logo.svg' },
  { name: 'H&M',     image: 'https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg' },
]

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTFlMTY4OTQzMjMwNWUyZmIxMGMxNTgiLCJpZCI6IjZhMWUxNjg5NDMyMzA1ZTJmYjEwYzE1OCIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgxNjYxNTA2LCJleHAiOjE3ODE3NDc5MDZ9.4cATk1CXg6Hgo5r5G2Nx9f68qqQ3puJjTwW7T107-ZA'

async function seedBrands() {
  for (const brand of brands) {
    try {
      const res = await axios.post('http://localhost:8000/api/v1/brands', brand, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      })
      console.log(`✅ Created: ${brand.name}`)
    } catch (err: any) {
   
      console.log(`❌ Failed: ${brand.name}`)
      console.log('Status:', err.response?.status)
      console.log('Error:', JSON.stringify(err.response?.data, null, 2))
    }
  }
}

seedBrands()