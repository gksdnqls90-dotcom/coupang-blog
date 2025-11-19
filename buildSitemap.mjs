// buildSitemap.js
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { firebaseConfig } from "./public/firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function buildSitemap() {
  const baseUrl = "https://icbhplus.com";

  const snapshot = await getDocs(collection(db, "keywords"));

  const pages = snapshot.docs.map((doc) => {
    const slug = doc.data().slug;
    return `${baseUrl}/live/${encodeURIComponent(slug)}`;
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  pages.forEach((url) => {
    xml += `
  <url>
    <loc>${url}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  xml += "\n</urlset>";

  fs.writeFileSync("./public/sitemap.xml", xml, "utf8");

  console.log("✅ sitemap.xml generated!");
}

buildSitemap();
