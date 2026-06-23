import axios from 'axios'
import FormData = require('form-data')
import * as https from 'https'
import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YTFlMTY4OTQzMjMwNWUyZmIxMGMxNTgiLCJpZCI6IjZhMWUxNjg5NDMyMzA1ZTJmYjEwYzE1OCIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgxNjYxNTA2LCJleHAiOjE3ODE3NDc5MDZ9.4cATk1CXg6Hgo5r5G2Nx9f68qqQ3puJjTwW7T107-ZA'
const BASE_URL = 'http://localhost:8000/api/v1'

// ── IDs ───────────────────────────────────────────
const categories = {
  electronics: '6a1de9969165ba83ebcaf17f',
  fashion:     '6a1deb499165ba83ebcaf19b',
  home:        '6a1deaa09165ba83ebcaf185',
  beauty:      '6a1deb1c9165ba83ebcaf195',
  sports:      '6a1deabd9165ba83ebcaf18b',
}

const brands = {
  apple:   '6a320794dffdb604c5618d5e',
  samsung: '6a320795dffdb604c5618d62',
  nike:    '6a208e063c85c6c27b94bf33',
  adidas:  '6a320796dffdb604c5618d68',
  sony:    '6a320797dffdb604c5618d6c',
  zara:    '6a320798dffdb604c5618d71',
  hm:      '6a320798dffdb604c5618d75',
}

// ── Helper: تحميل صورة من URL ─────────────────────
async function downloadImage(url: string, filename: string): Promise<string> {
  const tmpPath = path.join(os.tmpdir(), filename)
  const file    = fs.createWriteStream(tmpPath)
  const client  = url.startsWith('https') ? https : http

  return new Promise((resolve, reject) => {
    client.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close()
        fs.unlink(tmpPath, () => {})
        downloadImage(response.headers.location!, filename).then(resolve).catch(reject)
        return
      }
      response.pipe(file)
      file.on('finish', () => { file.close(); resolve(tmpPath) })
    }).on('error', (err) => { fs.unlink(tmpPath, () => {}); reject(err) })
  })
}

// ── Products Data ─────────────────────────────────
// الصور من Unsplash بـ keywords مناسبة لكل منتج
const products = [

  // ════════════════════════════════════════════════
  // ELECTRONICS (10)
  // ════════════════════════════════════════════════
  {
    title:              'iPhone 15 Pro Max',
    description:        'Latest Apple iPhone with A17 Pro chip, titanium design, and advanced camera system with 48MP main sensor. Features ProMotion display up to 120Hz and all-day battery life.',
    price:              18999,
    priceAfterDiscount: 16999,
    quantity:           50,
    color:              'Black Titanium,White Titanium,Natural Titanium,Blue Titanium',
    category:           categories.electronics,
    brand:              brands.apple,
    status:             'ACTIVE',
    isFeatured:         true,
    tags:               ['new-arrival', 'best-seller'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80',
  },
  {
    title:              'Samsung Galaxy S24 Ultra',
    description:        'Samsung flagship with built-in S Pen, 200MP quad camera, and Snapdragon 8 Gen 3. Features a 6.8-inch Dynamic AMOLED display with 120Hz refresh rate.',
    price:              16999,
    priceAfterDiscount: 15499,
    quantity:           40,
    color:              'Titanium Black,Titanium Gray,Titanium Violet,Titanium Yellow',
    category:           categories.electronics,
    brand:              brands.samsung,
    status:             'ACTIVE',
    isFeatured:         true,
    tags:               ['new-arrival', 'best-seller'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1706439136011-4c2d5a476a85?w=800&q=80',
  },
  {
    title:              'Apple MacBook Pro 14"',
    description:        'Supercharged by M3 Pro chip with up to 18-core CPU and 30-core GPU. Features a stunning Liquid Retina XDR display, up to 22 hours battery life, and blazing-fast SSD storage.',
    price:              19999,
    priceAfterDiscount: 18499,
    quantity:           25,
    color:              'Silver,Space Black',
    category:           categories.electronics,
    brand:              brands.apple,
    status:             'ACTIVE',
    isFeatured:         true,
    tags:               ['best-seller'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
  },
  {
    title:              'Sony WH-1000XM5 Headphones',
    description:        'Industry-leading noise cancelling headphones with 30-hour battery, multipoint connection, and crystal-clear hands-free calling. Auto Noise Cancelling Optimizer adjusts to your environment.',
    price:              4999,
    priceAfterDiscount: 3999,
    quantity:           60,
    color:              'Black,Platinum Silver',
    category:           categories.electronics,
    brand:              brands.sony,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['best-seller', 'sale'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80',
  },
  {
    title:              'Samsung 55" QLED 4K TV',
    description:        'Quantum HDR+ display with 100% Color Volume delivers incredibly vivid colors. Neo Quantum Processor 4K uses AI to upscale content to near-4K resolution with stunning clarity.',
    price:              12999,
    priceAfterDiscount: 10999,
    quantity:           30,
    color:              'Black',
    category:           categories.electronics,
    brand:              brands.samsung,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['sale'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=800&q=80',
  },
  {
    title:              'Apple AirPods Pro 2nd Gen',
    description:        'AirPods Pro feature up to 2x more Active Noise Cancellation, Adaptive Audio, and Personalized Spatial Audio. The H2 chip enables smarter noise cancellation and transparency.',
    price:              5999,
    priceAfterDiscount: 5499,
    quantity:           55,
    color:              'White',
    category:           categories.electronics,
    brand:              brands.apple,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['best-seller'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1606741965509-717b0f40e0a6?w=800&q=80',
  },
  {
    title:              'Sony PlayStation 5',
    description:        'Experience lightning-fast loading with the PS5 ultra-high speed SSD, deeper immersion with support for haptic feedback and adaptive triggers, and all-new 3D Audio technology.',
    price:              14999,
    priceAfterDiscount: 13499,
    quantity:           20,
    color:              'White,Black',
    category:           categories.electronics,
    brand:              brands.sony,
    status:             'ACTIVE',
    isFeatured:         true,
    tags:               ['best-seller'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800&q=80',
  },
  {
    title:              'Apple iPad Pro 12.9"',
    description:        'Apple M2 chip with next-level performance. Brilliant 12.9-inch Liquid Retina XDR display with ProMotion technology. Works with Apple Pencil and Magic Keyboard for ultimate productivity.',
    price:              16999,
    priceAfterDiscount: 15499,
    quantity:           35,
    color:              'Silver,Space Gray',
    category:           categories.electronics,
    brand:              brands.apple,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['new-arrival'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
  },
  {
    title:              'Samsung Galaxy Watch 6 Classic',
    description:        'The iconic rotating bezel makes a triumphant return. Track your health and fitness with advanced sensors including BIA body composition, ECG, and blood pressure monitoring.',
    price:              4499,
    priceAfterDiscount: 3799,
    quantity:           45,
    color:              'Black,Silver',
    category:           categories.electronics,
    brand:              brands.samsung,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['new-arrival'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  },
  {
    title:              'Sony Alpha A7 IV Camera',
    description:        'Full-frame mirrorless camera with 33MP sensor, 4K 60p video, and real-time autofocus. The evolved AF system with AI processing tracks subjects with incredible accuracy.',
    price:              19999,
    priceAfterDiscount: 17999,
    quantity:           15,
    color:              'Black',
    category:           categories.electronics,
    brand:              brands.sony,
    status:             'ACTIVE',
    isFeatured:         true,
    tags:               ['new-arrival', 'trending'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
  },

  // ════════════════════════════════════════════════
  // FASHION (8)
  // ════════════════════════════════════════════════
  {
    title:              'Nike Air Max 270',
    description:        'Inspired by two iconic Air Max shoes, the Air Max 270 features Nike biggest heel Air unit yet for an ultra-soft ride. The breathable mesh upper keeps your feet cool all day.',
    price:              2499,
    priceAfterDiscount: 1999,
    quantity:           100,
    color:              'Black/White,White/Red,Navy/Orange',
    category:           categories.fashion,
    brand:              brands.nike,
    status:             'ACTIVE',
    isFeatured:         true,
    tags:               ['best-seller', 'trending'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
  },
  {
    title:              'Adidas Ultraboost 23',
    description:        'Our most energy-returning running shoe features a Linear Energy Push system that stores energy and releases it when you need it most. BOOST midsole delivers incredible cushioning.',
    price:              2999,
    priceAfterDiscount: 2499,
    quantity:           80,
    color:              'Core Black,Cloud White,Lucid Blue',
    category:           categories.fashion,
    brand:              brands.adidas,
    status:             'ACTIVE',
    isFeatured:         true,
    tags:               ['best-seller'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
  },
  {
    title:              'Zara Slim Fit Wool Suit',
    description:        'Modern slim fit suit crafted from premium 100% wool fabric with a natural stretch for ultimate comfort. Features a two-button closure, notch lapels, and a fully lined interior.',
    price:              3999,
    priceAfterDiscount: 2999,
    quantity:           45,
    color:              'Navy Blue,Charcoal Gray,Classic Black',
    category:           categories.fashion,
    brand:              brands.zara,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['trending'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
  },
  {
    title:              'H&M Premium Cotton Shirt',
    description:        'Timeless Oxford shirt crafted from 100% premium combed cotton. Features a relaxed regular fit, button-down collar, and chest pocket. A wardrobe essential that pairs with everything.',
    price:              499,
    priceAfterDiscount: 399,
    quantity:           200,
    color:              'White,Light Blue,Sky Blue,Black',
    category:           categories.fashion,
    brand:              brands.hm,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['sale', 'best-seller'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80',
  },
  {
    title:              'Nike Tech Fleece Hoodie',
    description:        'Nike Tech Fleece engineered with a unique construction that is lightweight, warm, and smooth against skin. The double-faced fabric provides an elevated, modern look.',
    price:              1899,
    priceAfterDiscount: 1499,
    quantity:           90,
    color:              'Black,Dark Gray,Navy,Olive',
    category:           categories.fashion,
    brand:              brands.nike,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['trending', 'best-seller'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=800&q=80',
  },
  {
    title:              'Adidas Originals Superstar',
    description:        'The iconic shell-toe sneaker that started it all. Originally a basketball shoe in 1969, the Superstar became a street classic. Features full-grain leather upper and herringbone-pattern outsole.',
    price:              1599,
    priceAfterDiscount: 1299,
    quantity:           75,
    color:              'White/Black,Black/White,All White',
    category:           categories.fashion,
    brand:              brands.adidas,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['trending'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80',
  },
  {
    title:              'Zara Satin Midi Dress',
    description:        'Elegant midi dress in flowing satin fabric with a flattering V-neckline and adjustable spaghetti straps. Features a fluid silhouette that moves beautifully. Perfect for any occasion.',
    price:              1299,
    priceAfterDiscount: 999,
    quantity:           60,
    color:              'Dusty Rose,Midnight Black,Champagne',
    category:           categories.fashion,
    brand:              brands.zara,
    status:             'ACTIVE',
    isFeatured:         true,
    tags:               ['new-arrival', 'trending'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80',
  },
  {
    title:              'H&M Slim Fit Chinos',
    description:        'Smart slim-fit chinos crafted from stretch cotton for all-day comfort. Features a flat front, zip fly with button, and side and back pockets. Versatile enough for work or weekend.',
    price:              699,
    priceAfterDiscount: 549,
    quantity:           120,
    color:              'Khaki Beige,Navy Blue,Olive Green,Stone Gray',
    category:           categories.fashion,
    brand:              brands.hm,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['sale'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80',
  },

  // ════════════════════════════════════════════════
  // SPORTS (6)
  // ════════════════════════════════════════════════
  {
    title:              'Nike Dri-FIT Training Shorts',
    description:        'Sweat-wicking Nike Dri-FIT technology helps keep you dry and comfortable. Lightweight fabric moves with you through your toughest workouts. Elastic waistband with internal drawcord.',
    price:              699,
    priceAfterDiscount: 549,
    quantity:           150,
    color:              'Black,Dark Gray,Navy,Royal Blue',
    category:           categories.sports,
    brand:              brands.nike,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['best-seller', 'sale'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=800&q=80',
  },
  {
    title:              'Adidas Predator Elite FG',
    description:        'Engineered for total control, the Predator Elite features a CONTROLFRAME outsole for explosive power and precision. Demonskin spines give you maximum grip on the ball.',
    price:              3499,
    priceAfterDiscount: 2799,
    quantity:           70,
    color:              'Core Black/White,Solar Red/Black',
    category:           categories.sports,
    brand:              brands.adidas,
    status:             'ACTIVE',
    isFeatured:         true,
    tags:               ['best-seller', 'trending'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=800&q=80',
  },
  {
    title:              'Nike Pro Compression Tights',
    description:        'Nike Pro tights are built for high-intensity training. Sweat-wicking fabric helps keep you dry and comfortable while the stretchy material moves with every rep, lunge, and sprint.',
    price:              899,
    priceAfterDiscount: 749,
    quantity:           100,
    color:              'Black,Dark Smoke Gray,Navy',
    category:           categories.sports,
    brand:              brands.nike,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['sale'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80',
  },
  {
    title:              'Adidas Tiro 23 Training Jersey',
    description:        'Made with AEROREADY technology that absorbs moisture so you stay dry and focused. Mesh inserts on the sides and underarms enhance ventilation during intense sessions.',
    price:              799,
    priceAfterDiscount: 649,
    quantity:           85,
    color:              'Black/White,Team Royal Blue,Power Red',
    category:           categories.sports,
    brand:              brands.adidas,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['sale'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
  },
  {
    title:              'Nike Metcon 9 Training Shoes',
    description:        'The Nike Metcon 9 is your ultimate cross training shoe. A wide, flat heel provides stability for lifting while the forefoot has enough flexibility for short runs and plyometrics.',
    price:              2799,
    priceAfterDiscount: 2299,
    quantity:           65,
    color:              'Black/White,Wolf Gray,Gym Blue',
    category:           categories.sports,
    brand:              brands.nike,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['trending'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80',
  },
  {
    title:              'Adidas Adizero Running Jacket',
    description:        'Built for speed, the Adizero jacket is made with ultra-lightweight Adizero fabric that provides wind protection without weighing you down. Reflective details enhance visibility in low light.',
    price:              1999,
    priceAfterDiscount: 1599,
    quantity:           55,
    color:              'Black,Solar Red,Team Royal Blue',
    category:           categories.sports,
    brand:              brands.adidas,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['new-arrival'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?w=800&q=80',
  },

  // ════════════════════════════════════════════════
  // HOME (4)
  // ════════════════════════════════════════════════
  {
    title:              'Samsung French Door Refrigerator',
    description:        'Twin Cooling Plus independently controls fridge and freezer to maintain optimal humidity levels. The spacious 29 cu ft capacity has flexible storage solutions for every need.',
    price:              18999,
    priceAfterDiscount: 16999,
    quantity:           20,
    color:              'Stainless Steel,Black Stainless',
    category:           categories.home,
    brand:              brands.samsung,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['new-arrival'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&q=80',
  },
  {
    title:              'Sony HT-A7000 Soundbar',
    description:        '7.1.2ch Dolby Atmos and DTS:X soundbar with 360 Spatial Sound Mapping. Vertical Surround Engine and S-Force PRO Front Surround create a breathtaking 3D audio experience.',
    price:              9999,
    priceAfterDiscount: 8499,
    quantity:           25,
    color:              'Black',
    category:           categories.home,
    brand:              brands.sony,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['trending'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80',
  },
  {
    title:              'Samsung QuickDrive Washing Machine',
    description:        'QuickDrive technology cuts washing time by up to 50% without compromising on cleaning performance. AI Control learns your washing habits to recommend the most efficient cycle.',
    price:              12999,
    priceAfterDiscount: 10999,
    quantity:           18,
    color:              'White,Champagne',
    category:           categories.home,
    brand:              brands.samsung,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['sale'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&q=80',
  },
  {
    title:              'Sony SRS-XB43 Bluetooth Speaker',
    description:        'Extra Bass delivers powerful, punchy low-end sound. IP67 waterproof and dustproof rating makes it perfect for outdoor adventures. 24-hour battery life keeps the party going all day.',
    price:              2999,
    priceAfterDiscount: 2499,
    quantity:           40,
    color:              'Black,Blue,Red,Green',
    category:           categories.home,
    brand:              brands.sony,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['best-seller', 'sale'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80',
  },

  // ════════════════════════════════════════════════
  // BEAUTY (2)
  // ════════════════════════════════════════════════
  {
    title:              'Apple Watch Series 9',
    description:        'The most powerful Apple Watch yet. New Double Tap gesture lets you control Apple Watch with one hand. The brightest Apple Watch display ever. Advanced health features including ECG and blood oxygen.',
    price:              8999,
    priceAfterDiscount: 7999,
    quantity:           50,
    color:              'Midnight,Starlight,Pink,Product Red,Silver',
    category:           categories.beauty,
    brand:              brands.apple,
    status:             'ACTIVE',
    isFeatured:         true,
    tags:               ['new-arrival', 'trending'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&q=80',
  },
  {
    title:              'Samsung Galaxy Buds2 Pro',
    description:        'Intelligent ANC blocks out more noise than ever for total immersion. 360 Audio with head tracking puts you in the center of the music. 24-bit Hi-Fi audio delivers studio-quality sound.',
    price:              3499,
    priceAfterDiscount: 2999,
    quantity:           60,
    color:              'Graphite,White,Bora Purple',
    category:           categories.beauty,
    brand:              brands.samsung,
    status:             'ACTIVE',
    isFeatured:         false,
    tags:               ['best-seller'],
    imageCoverUrl:      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
  },
]

// ── Seed Function ─────────────────────────────────
async function seedProducts() {
  console.log(`\n🚀 Seeding ${products.length} products...\n`)

  let success = 0
  let failed  = 0

  for (const product of products) {
    try {
      const filename = `${product.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.jpg`
      const imgPath  = await downloadImage(product.imageCoverUrl, filename)

      const form = new FormData()
      form.append('title',       product.title)
      form.append('description', product.description)
      form.append('price',       product.price.toString())
      form.append('quantity',    product.quantity.toString())
      form.append('color',       product.color)
      form.append('category',    product.category)
      form.append('brand',       product.brand)
      form.append('status',      product.status)
      form.append('isFeatured',  product.isFeatured.toString())
      product.tags.forEach(tag => form.append('tags[]', tag))
      form.append('imageCover',  fs.createReadStream(imgPath), {
        filename,
        contentType: 'image/jpeg',
      })
      if (product.priceAfterDiscount) {
        form.append('priceAfterDiscount', product.priceAfterDiscount.toString())
      }

      await axios.post(`${BASE_URL}/products`, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${TOKEN}`,
        },
      })

      fs.unlinkSync(imgPath)
      console.log(`✅ Created: ${product.title}`)
      success++

    } catch (err: any) {
      console.log(`❌ Failed:  ${product.title}`)
      console.log(`   Error:   ${JSON.stringify(err.response?.data?.message ?? err.message)}`)
      failed++
    }

    await new Promise(resolve => setTimeout(resolve, 4000))
  }

  console.log(`\n📊 Done! ✅ Success: ${success} | ❌ Failed: ${failed}\n`)
}

seedProducts()