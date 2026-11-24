/* UniMart – starting (mock) data. Edit freely: this is what a fresh browser sees. */
window.UM = window.UM || {};

UM.universities = [
  "University of Colombo", "University of Peradeniya", "University of Moratuwa",
  "University of Kelaniya", "University of Sri Jayewardenepura", "University of Ruhuna",
  "University of Jaffna", "Rajarata University", "Sabaragamuwa University",
  "Wayamba University", "Uva Wellassa University", "Eastern University", "SLIIT", "NSBM", "Open University"
];

/* icon: an SVG path drawn on a 24x24 grid */
UM.categories = [
  { id: "electronics", name: "Electronics", kind: "item", hue: 210,
    icon: "M4 5h16v10H4zM2 17h20v2H2z" },
  { id: "books", name: "Books & Notes", kind: "item", hue: 28,
    icon: "M5 3h11a3 3 0 0 1 3 3v15H7a2 2 0 0 1-2-2zm2 14v2h10v-2z" },
  { id: "hostel", name: "Hostel & Room", kind: "item", hue: 150,
    icon: "M3 18v-7a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v7h-2v-2H5v2zm3-6h5v-2H6z" },
  { id: "fashion", name: "Fashion", kind: "item", hue: 330,
    icon: "M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0z" },
  { id: "food", name: "Food & Snacks", kind: "item", hue: 12,
    icon: "M4 11h16a8 8 0 0 1-16 0zm3-7c1 1 1 3 0 4m5-4c1 1 1 3 0 4m5-4c1 1 1 3 0 4" },
  { id: "sports", name: "Sports & Bikes", kind: "item", hue: 95,
    icon: "M5 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 15l4-7h4l3 7M10 8h3" },
  { id: "tutoring", name: "Tutoring", kind: "service", hue: 265,
    icon: "M12 3 1 9l11 6 9-4.9V17h2V9zM5 13.2V17c2 2 12 2 14 0v-3.8L12 17z" },
  { id: "design", name: "Design & Printing", kind: "service", hue: 300,
    icon: "M6 9V3h12v6M6 18H4v-7h16v7h-2M7 15h10v6H7z" },
  { id: "repairs", name: "Repairs & Tech help", kind: "service", hue: 190,
    icon: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" },
  { id: "photo", name: "Photography", kind: "service", hue: 45,
    icon: "M4 7h3l2-3h6l2 3h3v13H4zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" },
  { id: "transport", name: "Rides & Delivery", kind: "service", hue: 0,
    icon: "M3 13l2-6h14l2 6v5h-2v2h-3v-2H8v2H5v-2H3zm3 0h12l-1-3H7z" },
  { id: "other", name: "Other services", kind: "service", hue: 230,
    icon: "M12 2l2.9 6.9L22 9.3l-5.5 4.7 1.7 7L12 17.3 5.8 21l1.7-7L2 9.3l7.1-.4z" },
  /* events and notices: "event" = has a date and venue, "stock" = limited tickets / stalls */
  { id: "tickets", name: "Event tickets", kind: "item", event: true, stock: true, hue: 345,
    icon: "M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM14 7v10" },
  { id: "stalls", name: "Stalls & Fairs", kind: "service", event: true, stock: true, hue: 20,
    icon: "M3 9l2-5h14l2 5M3 9h18M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v8h14v-8" },
  { id: "classes", name: "Classes & Courses", kind: "service", schedule: true, hue: 200,
    icon: "M3 4h18v12H3zM8 20h8M12 16v4M7 8h6M7 11h10" },
  { id: "notices", name: "Ads & Notices", kind: "notice", hue: 52,
    icon: "M4 10v4h3l6 4V6L7 10zm12-2a5 5 0 0 1 0 8" }
];

UM.sellers = {
  s1: { id: "s1", name: "Kavindi P.", uni: "University of Moratuwa", rating: 4.9, sales: 132, joined: "2024" },
  s2: { id: "s2", name: "Tharindu S.", uni: "University of Peradeniya", rating: 4.7, sales: 58, joined: "2023" },
  s3: { id: "s3", name: "Aisha R.", uni: "University of Colombo", rating: 4.8, sales: 91, joined: "2025" },
  s4: { id: "s4", name: "Nimal J.", uni: "University of Kelaniya", rating: 4.5, sales: 27, joined: "2025" },
  s5: { id: "s5", name: "Senthuran K.", uni: "University of Jaffna", rating: 4.9, sales: 210, joined: "2022" },
  s6: { id: "s6", name: "Dinithi W.", uni: "University of Sri Jayewardenepura", rating: 4.6, sales: 44, joined: "2024" },
  s7: { id: "s7", name: "Ravindu M.", uni: "SLIIT", rating: 4.8, sales: 76, joined: "2023" },
  s8: { id: "s8", name: "Hasini D.", uni: "University of Ruhuna", rating: 4.4, sales: 19, joined: "2025" },
  s9: { id: "s9", name: "Music Society", society: "Music Society, University of Colombo", uni: "University of Colombo", rating: 4.9, sales: 640, joined: "2022" },
  s10: { id: "s10", name: "Rotaract Club", society: "Rotaract Club of University of Moratuwa", uni: "University of Moratuwa", rating: 4.8, sales: 310, joined: "2023" },
  s11: { id: "s11", name: "Japanese Circle", society: "Japanese Language Circle, University of Kelaniya", uni: "University of Kelaniya", rating: 4.7, sales: 85, joined: "2024" }
};

/* price in LKR; was = old price for deals; unit for services */
UM.seedListings = [
  { id: "l1", title: "Casio fx-991ES Plus scientific calculator", cat: "electronics", price: 3800, was: 5200, cond: "Like new", seller: "s1", sold: 41, desc: "Used for one semester. All functions work, comes with cover. Perfect for engineering and science exams." },
  { id: "l2", title: "Lenovo ThinkPad T480 · i5 · 16GB · 256GB SSD", cat: "electronics", price: 98000, was: 115000, cond: "Good", seller: "s7", sold: 6, desc: "Battery lasts about 4 hours. Small scratch on the lid. Charger included. Can meet at campus to test." },
  { id: "l3", title: "Engineering Mathematics (K.A. Stroud) 7th ed.", cat: "books", price: 2500, cond: "Good", seller: "s1", sold: 12, desc: "Some pencil notes in chapters 1-4. Otherwise clean." },
  { id: "l4", title: "Full set of 1st year Law notes (typed, 320 pages)", cat: "books", price: 1800, was: 2400, cond: "New", seller: "s3", sold: 87, desc: "Neatly typed notes covering Legal System, Contract and Constitutional Law. Printed and bound." },
  { id: "l5", title: "Single bed + mattress (near Peradeniya campus)", cat: "hostel", price: 14500, cond: "Good", seller: "s2", sold: 2, desc: "Moving out of my boarding. Buyer collects from Kandy road, 5 min from the main gate." },
  { id: "l6", title: "Table fan · 16 inch · 3 speeds", cat: "hostel", price: 4200, was: 6500, cond: "Like new", seller: "s4", sold: 9, desc: "Very quiet. Bought 4 months ago." },
  { id: "l7", title: "University hoodie · navy · S to XL", cat: "fashion", price: 3200, cond: "New", seller: "s6", sold: 154, desc: "Thick cotton hoodie with front print. Pre-order sizes S, M, L, XL. Delivered on campus." },
  { id: "l8", title: "Homemade chocolate brownies · box of 6", cat: "food", price: 900, cond: "New", seller: "s8", sold: 312, desc: "Fresh every Friday. Order before Thursday 8 pm. Pick up at the canteen." },
  { id: "l9", title: "Mountain bike · 26 inch · 21 gears", cat: "sports", price: 27500, was: 32000, cond: "Good", seller: "s5", sold: 3, desc: "Recently serviced, new brake pads. Great for getting around campus." },
  { id: "l10", title: "Cricket bat (English willow) + pads", cat: "sports", price: 11000, cond: "Good", seller: "s2", sold: 4, desc: "Used for one season in the faculty team." },
  { id: "l11", title: "Python & Data Structures tutoring", cat: "tutoring", price: 1500, unit: "per hour", seller: "s7", sold: 63, service: true, desc: "Final-year CS student. Online or in the library. I help you understand, not do your work for you." },
  { id: "l12", title: "A/L Combined Maths & Physics classes", cat: "tutoring", price: 1200, unit: "per hour", seller: "s5", sold: 140, service: true, desc: "Group or one-to-one. Sinhala, Tamil or English medium." },
  { id: "l13", title: "Poster, CV and slide design", cat: "design", price: 2000, unit: "per design", seller: "s3", sold: 77, service: true, desc: "Society event posters, CVs, research posters. 2 revisions included. Ready in 48 hours." },
  { id: "l14", title: "Thesis printing & hard binding", cat: "design", price: 3500, unit: "per copy", seller: "s6", sold: 205, service: true, desc: "Gold lettering on the cover, up to 150 pages. Same-day service if ordered before 10 am." },
  { id: "l15", title: "Laptop repair · Windows reinstall · virus clean", cat: "repairs", price: 2500, was: 3500, unit: "per job", seller: "s7", sold: 98, service: true, desc: "Keeps your files safe. Screen and keyboard replacement quoted separately." },
  { id: "l16", title: "Phone screen replacement (most models)", cat: "repairs", price: 6000, unit: "from", seller: "s4", sold: 33, service: true, desc: "Done in about an hour on campus. 30-day warranty." },
  { id: "l17", title: "Graduation & convocation photoshoot", cat: "photo", price: 8000, was: 10000, unit: "per session", seller: "s1", sold: 120, service: true, desc: "1 hour, 40+ edited photos, delivered in 3 days. Group shoots welcome." },
  { id: "l18", title: "Event photography for society events", cat: "photo", price: 15000, unit: "per event", seller: "s8", sold: 14, service: true, desc: "Up to 4 hours. Edited album and highlight reel." },
  { id: "l19", title: "Tuk ride to Kandy town · shared", cat: "transport", price: 300, unit: "per seat", seller: "s2", sold: 400, service: true, desc: "Daily at 5 pm and 7 pm from the main gate. Message to book a seat." },
  { id: "l20", title: "Canteen food delivery to hostels", cat: "transport", price: 150, unit: "per order", seller: "s5", sold: 860, service: true, desc: "From any canteen to any hostel on campus within 20 minutes." },
  { id: "l21", title: "English proofreading for reports & essays", cat: "other", price: 500, unit: "per 1000 words", seller: "s3", sold: 66, service: true, desc: "Grammar and clarity checks. I do not write the content for you." },
  { id: "l22", title: "Arduino Uno starter kit", cat: "electronics", price: 5500, was: 7000, cond: "Like new", seller: "s1", sold: 18, desc: "Breadboard, sensors, LEDs, jumper wires. Used for one project." },
  { id: "l23", title: "Lab coat + safety goggles", cat: "fashion", price: 1600, cond: "Good", seller: "s6", sold: 25, desc: "Size M. Washed and ironed." },
  { id: "l24", title: "Rice & curry lunch packets", cat: "food", price: 350, cond: "New", seller: "s4", sold: 980, desc: "Veg or chicken. Order by 10 am for 12:30 delivery near the library." },
  { id: "l25", title: "\u201cSaraswathi Nadha\u201d annual musical show \u00b7 normal ticket", cat: "tickets", price: 1000, was: 1500, seller: "s9", sold: 412, stock: 600, eventIn: 9, eventHour: 18, venue: "Nawarangahala, Colombo", desc: "Our annual concert with the university choir, band and guest artists. Early-bird price until next Friday. Show the e-ticket (order number) at the gate." },
  { id: "l26", title: "\u201cSaraswathi Nadha\u201d musical show \u00b7 VIP ticket", cat: "tickets", price: 3000, seller: "s9", sold: 96, stock: 120, eventIn: 9, eventHour: 18, venue: "Nawarangahala, Colombo", desc: "Front rows, a programme booklet and refreshments at the interval." },
  { id: "l27", title: "Food stall at the Rotaract Charity Carnival", cat: "stalls", price: 7500, unit: "per stall", seller: "s10", sold: 18, stock: 30, eventIn: 16, eventHour: 9, venue: "Main grounds, University of Moratuwa", desc: "3m x 3m stall with a table and two chairs. Electricity available for Rs 1,000 more. All profits from stall fees go to the children's ward project." },
  { id: "l28", title: "Rotaract Charity Carnival \u00b7 entry ticket", cat: "tickets", price: 200, seller: "s10", sold: 233, stock: 2000, eventIn: 16, eventHour: 9, venue: "Main grounds, University of Moratuwa", desc: "Day pass for games, food stalls and the evening DJ night." },
  { id: "l29", title: "Japanese JLPT N5 class (12 weeks)", cat: "classes", price: 6000, unit: "per course", seller: "s11", sold: 41, schedule: "Every Saturday, 9:00 to 11:00 am, starting next month", venue: "Room A-204, Faculty of Humanities", desc: "Beginner class taught by senior students who passed N3. Includes notes and two mock exams." },
  { id: "l30", title: "Volunteers wanted for the beach clean-up", cat: "notices", price: 0, seller: "s10", sold: 0, eventIn: 5, eventHour: 7, venue: "Mount Lavinia beach", desc: "Join us for a morning clean-up. Transport and breakfast provided. Message us to register." },
  { id: "l31", title: "Ad: Printing shop near main gate, 10% off for students", cat: "notices", price: 0, seller: "s6", sold: 0, desc: "Show your student ID. Colour printing, binding, lamination. Open 7 am to 9 pm." }
];
