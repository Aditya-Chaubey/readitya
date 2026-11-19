/* CIPHER — sample data so a fresh console isn't empty. Clear it in Settings → Burn notice. */
(() => {
  "use strict";
  const { uid, today, addDays, addMonths } = CX;

  // deterministic pseudo-random for drill history
  const rnd = (seed) => { let h = 2166136261; for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };

  CX.seed = () => {
    const t = today();
    const s = CX.blank();
    const ym = t.slice(0, 7);
    s.settings.budget = 45000;
    s.settings.catBudgets = { Groceries: 8000, Dining: 4000, Transport: 3000, Shopping: 5000, Entertainment: 2500 };

    // ----- Accounts -----
    const bank = uid(), cash = uid(), card = uid(), invest = uid();
    s.accounts = [
      { id: bank, name: "Primary savings", type: "Bank", opening: 85000, notes: "" },
      { id: card, name: "Credit card", type: "Card", opening: 0, notes: "Bill due on the 20th" },
      { id: cash, name: "Cash", type: "Cash", opening: 4000, notes: "" },
      { id: invest, name: "Brokerage", type: "Investment", opening: 150000, notes: "Index funds" },
    ];

    // ----- Transactions: three months of history -----
    const tx = (m, day, type, amount, category, payee, account, toAccount = "") => {
      const date = `${addMonths(ym + "-01", m).slice(0, 7)}-${String(day).padStart(2, "0")}`;
      if (date <= t) s.txns.push({ id: uid(), type, amount, category, payee, account, toAccount, date, tags: "" });
    };
    [-2, -1, 0].forEach((m) => {
      tx(m, 1, "income", 60000, "Salary", "Monthly salary", bank);
      tx(m, 3, "expense", 18000, "Housing", "Rent", bank);
      tx(m, 5, "expense", 2350 + m * 120, "Groceries", "Supermarket", card);
      tx(m, 7, "expense", 649, "Subscriptions", "Streaming", card);
      tx(m, 8, "expense", 2500, "Health", "Gym membership", bank);
      tx(m, 10, "expense", 1800 - m * 200, "Dining", "Dinner out", card);
      tx(m, 12, "expense", 1200, "Transport", "Fuel", card);
      tx(m, 14, "expense", 2100, "Groceries", "Supermarket", card);
      tx(m, 16, "expense", 399, "Bills", "Phone plan", bank);
      tx(m, 18, "expense", 3200 + m * 900, "Shopping", "Clothing", card);
      tx(m, 19, "expense", 850, "Entertainment", "Cinema", cash);
      tx(m, 22, "income", 8000 - m * 1500, "Freelance", "Consulting", bank);
      tx(m, 24, "expense", 1600, "Dining", "Lunch meetings", card);
      tx(m, 20, "transfer", 10500, "Bills", "Card bill payment", bank, card);
      tx(m, 26, "transfer", 5000, "Investment", "Monthly SIP", bank, invest);
    });

    // ----- Recurring -----
    const nextOn = (day) => { let d = `${ym}-${String(day).padStart(2, "0")}`; if (d < t) d = addMonths(d, 1); return d; };
    s.recurring = [
      { id: uid(), name: "Rent", type: "expense", amount: 18000, cycle: "monthly", nextDate: nextOn(3), category: "Housing", account: bank, active: true, notes: "" },
      { id: uid(), name: "Streaming", type: "expense", amount: 649, cycle: "monthly", nextDate: nextOn(7), category: "Subscriptions", account: card, active: true, notes: "" },
      { id: uid(), name: "Gym membership", type: "expense", amount: 2500, cycle: "monthly", nextDate: nextOn(8), category: "Health", account: bank, active: true, notes: "" },
      { id: uid(), name: "Phone plan", type: "expense", amount: 399, cycle: "monthly", nextDate: nextOn(16), category: "Bills", account: bank, active: true, notes: "" },
      { id: uid(), name: "Health insurance", type: "expense", amount: 14500, cycle: "yearly", nextDate: addDays(t, 38), category: "Insurance", account: bank, active: true, notes: "Family floater" },
      { id: uid(), name: "Salary", type: "income", amount: 60000, cycle: "monthly", nextDate: nextOn(1), category: "Salary", account: bank, active: true, notes: "" },
    ];

    // ----- Reserves -----
    s.reserves = [
      { id: uid(), name: "Emergency fund", target: 300000, saved: 120000, deadline: addDays(t, 300), notes: "Six months of expenses", log: [] },
      { id: uid(), name: "Japan expedition", target: 200000, saved: 45000, deadline: addDays(t, 240), notes: "Tokyo, Kyoto, Hokkaido", log: [] },
      { id: uid(), name: "New laptop", target: 120000, saved: 82000, deadline: addDays(t, 60), notes: "", log: [] },
    ];

    // ----- Events -----
    const sunday = addDays(t, (7 - CX.parse(t).getDay()) % 7);
    s.events = [
      { id: uid(), title: "Morning run", category: "Training", date: addDays(t, -14), time: "06:30", endTime: "07:15", recur: "weekdays", until: "", location: "Lodhi Garden", with: "", notes: "5 km easy pace" },
      { id: uid(), title: "Weekly review", category: "Personal", date: sunday, time: "19:00", endTime: "19:45", recur: "weekly", until: "", location: "", with: "", notes: "Review missions, treasury and network." },
      { id: uid(), title: "Deep work block", category: "Work", date: t, time: "10:00", endTime: "12:30", recur: "none", until: "", location: "Office", with: "", notes: "Phone in the drawer." },
      { id: uid(), title: "Dinner", category: "Social", date: addDays(t, 2), time: "20:00", endTime: "22:00", recur: "none", until: "", location: "Indian Accent", with: "Rhea Kapoor", notes: "" },
      { id: uid(), title: "Strategy presentation", category: "Meeting", date: addDays(t, 5), time: "15:00", endTime: "16:00", recur: "none", until: "", location: "Board room", with: "Vikram Sethi", notes: "Bring printed deck." },
      { id: uid(), title: "Dentist", category: "Health", date: addDays(t, 9), time: "11:00", endTime: "11:45", recur: "none", until: "", location: "", with: "", notes: "" },
      { id: uid(), title: "Flight to Mumbai", category: "Travel", date: addDays(t, 16), time: "07:40", endTime: "09:55", recur: "none", until: "", location: "T3", with: "", notes: "Seat 2A. Web check-in 48h before." },
    ];

    // ----- Missions -----
    const o = (text, done, due = "") => ({ id: uid(), text, done, due, doneOn: done ? addDays(t, -10) : "" });
    s.missions = [
      { id: uid(), codename: "Iron Meridian", title: "Run a half marathon", category: "Health", priority: "1", status: "active", startDate: addDays(t, -45), deadline: addDays(t, 120),
        brief: "Build endurance to 21 km and finish under 2 hours.", motive: "Prove discipline compounds.", reward: "New running watch",
        objectives: [o("Run 3× per week for a month", true), o("Complete a 10 km run", true), o("Register for a race", false, addDays(t, 12)), o("Long run of 16 km", false, addDays(t, 60)), o("Race day", false, addDays(t, 120))],
        log: [{ id: uid(), date: addDays(t, -3), text: "10 km in 58 minutes. Knees fine." }] },
      { id: uid(), codename: "Velvet Lantern", title: "Read 24 books this year", category: "Learning", priority: "2", status: "active", startDate: addDays(t, -300), deadline: addDays(t, 42),
        brief: "Two a month, alternating fiction and non-fiction.", motive: "", reward: "",
        objectives: [o("Books 1–12", true), o("Books 13–18", true), o("Books 19–22", false), o("Books 23–24", false)], log: [] },
      { id: uid(), codename: "Golden Citadel", title: "Build a six-month emergency fund", category: "Finance", priority: "1", status: "active", startDate: addDays(t, -60), deadline: addDays(t, 300),
        brief: "₹3,00,000 parked in a liquid fund.", motive: "Freedom to say no.", reward: "",
        objectives: [o("Open a liquid fund", true), o("Automate monthly transfer", true), o("Reach ₹1.5L", false), o("Reach ₹3L", false)], log: [] },
      { id: uid(), codename: "Northern Sparrow", title: "Reach A2 French", category: "Learning", priority: "3", status: "paused", startDate: addDays(t, -90), deadline: addDays(t, 200),
        brief: "Conversational basics before the Paris trip.", motive: "", reward: "",
        objectives: [o("Finish beginner course", true), o("30-day speaking streak", false)], log: [] },
      { id: uid(), codename: "Silent Falcon", title: "Earn a cloud certification", category: "Career", priority: "2", status: "done", startDate: addDays(t, -150), deadline: addDays(t, -20), completedOn: addDays(t, -25),
        brief: "Pass the associate-level exam.", motive: "", reward: "Weekend away",
        debrief: "Passed with 86%. Practice exams were the difference; should have started them earlier.",
        objectives: [o("Complete course", true), o("Three practice exams", true), o("Sit the exam", true)], log: [] },
    ];

    // ----- Drills (habits) with ~60 days of history -----
    const drill = (name, category, freq, slot, rate, target = 0) => {
      const d = { id: uid(), name, category, freq, slot, target, started: addDays(t, -70), notes: "", archived: false, log: {} };
      for (let i = 1; i <= 60; i++) { const day = addDays(t, -i); if (rnd(name + day) < rate) d.log[day] = true; }
      return d;
    };
    s.drills = [
      drill("Morning run", "Fitness", "weekdays", "Morning", 0.8),
      drill("Meditate 10 minutes", "Mind", "daily", "Morning", 0.75),
      drill("Read 30 pages", "Learning", "daily", "Evening", 0.7),
      drill("No screens after 23:00", "Discipline", "daily", "Evening", 0.55),
      drill("Strength training", "Fitness", "weekly", "Afternoon", 0.45, 3),
    ];
    s.drills[1].log[t] = true;

    // ----- People -----
    const ix = (days, type, note) => ({ id: uid(), date: addDays(t, -days), type, note });
    s.people = [
      { id: uid(), name: "Rhea Kapoor", alias: "R", tier: "inner", relation: "Friend", company: "Kapoor & Co.", role: "Architect", location: "Mumbai", phone: "", email: "", social: "", birthday: addDays(t, 9).slice(5), howMet: "College, first year", cadence: 21, lastContact: "", family: "Sister: Tara", interests: "Jazz, modernist buildings, Negronis", giftIdeas: "First-edition design books", tags: "college, inner circle", notes: "Prefers calls over texts.", interactions: [ix(41, "Call", "Talked about her new studio.")] },
      { id: uid(), name: "Vikram Sethi", alias: "", tier: "trusted", relation: "Mentor", company: "Meridian Capital", role: "Managing Director", location: "Delhi", phone: "", email: "", social: "", birthday: "1971-03-14", howMet: "Internship, 2023", cadence: 30, lastContact: "", family: "", interests: "Golf, single malts, military history", giftIdeas: "", tags: "work, mentor", notes: "Ask about the strategy role.", interactions: [ix(8, "Meeting", "Coffee. Advised me to own the presentation."), ix(52, "Email", "Sent quarterly update.")] },
      { id: uid(), name: "Ananya Rao", alias: "", tier: "inner", relation: "Sister", company: "", role: "Doctor", location: "Bengaluru", phone: "", email: "", social: "", birthday: addDays(t, 24).slice(5), howMet: "Family", cadence: 7, lastContact: "", family: "", interests: "Trekking, cooking", giftIdeas: "Trekking poles", tags: "family", notes: "", interactions: [ix(3, "Call", "Weekly call.")] },
      { id: uid(), name: "Marcus Hale", alias: "The Fixer", tier: "associate", relation: "Colleague", company: "Northwind", role: "Head of Operations", location: "London", phone: "", email: "", social: "", birthday: "", howMet: "Conference in Singapore", cadence: 60, lastContact: "", family: "", interests: "Formula 1", giftIdeas: "", tags: "work, international", notes: "Knows everyone in logistics.", interactions: [ix(75, "Message", "Congratulated him on the promotion.")] },
      { id: uid(), name: "Kabir Malhotra", alias: "", tier: "trusted", relation: "Friend", company: "", role: "Founder", location: "Delhi", phone: "", email: "", social: "", birthday: "", howMet: "Running club", cadence: 30, lastContact: "", family: "", interests: "Startups, marathons", giftIdeas: "", tags: "running", notes: "Training partner for the half marathon.", interactions: [ix(12, "Meeting", "Long run together.")] },
      { id: uid(), name: "Elena Petrova", alias: "", tier: "acquaintance", relation: "Contact", company: "Embassy cultural office", role: "Attaché", location: "Delhi", phone: "", email: "", social: "", birthday: "", howMet: "Gallery opening", cadence: 90, lastContact: "", family: "", interests: "Ballet, chess", giftIdeas: "", tags: "culture", notes: "", interactions: [] },
    ];

    // ----- Skills -----
    const sess = (days, minutes, note = "") => ({ id: uid(), date: addDays(t, -days), minutes, note });
    s.skills = [
      { id: uid(), name: "Public speaking", category: "Influence", status: "mastered", level: 4, targetLevel: 5, priority: "Medium", started: "", resources: "", notes: "", sessions: [sess(6, 45, "Rehearsed presentation")] },
      { id: uid(), name: "Negotiation", category: "Influence", status: "mastered", level: 3, targetLevel: 4, priority: "Medium", started: "", resources: "Never Split the Difference", notes: "", sessions: [] },
      { id: uid(), name: "Python", category: "Technical", status: "training", level: 2, targetLevel: 4, priority: "High", started: addDays(t, -40), resources: "Automate the Boring Stuff\nhttps://docs.python.org/3/tutorial/", notes: "", sessions: [sess(1, 60, "Scripts for expense import"), sess(4, 45), sess(9, 90, "Data structures")] },
      { id: uid(), name: "French", category: "Languages", status: "training", level: 1, targetLevel: 3, priority: "Medium", started: addDays(t, -90), resources: "Duolingo\nInnerFrench podcast", notes: "", sessions: [sess(2, 20), sess(3, 20), sess(5, 30)] },
      { id: uid(), name: "Krav Maga", category: "Combat", status: "target", level: 0, targetLevel: 2, priority: "High", started: "", resources: "Find a dojo nearby", notes: "", sessions: [] },
      { id: uid(), name: "Sailing", category: "Field", status: "target", level: 0, targetLevel: 2, priority: "Low", started: "", resources: "", notes: "", sessions: [] },
      { id: uid(), name: "Poker", category: "Influence", status: "target", level: 0, targetLevel: 3, priority: "Low", started: "", resources: "", notes: "Reading people under pressure.", sessions: [] },
    ];

    // ----- Field log -----
    const j = (days, title, mood, energy, body, wins, lessons, tags) => ({ id: uid(), date: addDays(t, -days), title, mood, energy, body, wins, lessons, tags });
    s.journal = [
      j(1, "Clean execution", 4, 4, "Finished the deck early and ran 6 km.", "Deck done a day early", "Mornings are my best hours", "work, training"),
      j(2, "Slow start", 3, 2, "Slept badly. Recovered after lunch.", "Still hit every drill", "No caffeine after 4pm", "sleep"),
      j(4, "Good conversation with V.", 5, 4, "Mentor meeting went well. New direction for the quarter.", "Clarity on the strategy role", "Ask for advice more often", "career"),
      j(6, "Grinding", 3, 3, "Long day, nothing remarkable.", "", "", ""),
      j(9, "Weekend recon", 4, 5, "Explored the old city on foot. Found a quiet café to work from.", "Discovered a new safehouse café", "", "city, rest"),
    ];

    // ----- Vault -----
    s.vault = [
      { id: uid(), title: "Passport", kind: "Identity", reference: "Z4821937", issuer: "Passport Office", issued: addDays(t, -3600), expiry: addDays(t, 50), location: "Home safe, top shelf", notes: "Renew at least 6 months before international travel.", pinned: true },
      { id: uid(), title: "Driving licence", kind: "Identity", reference: "DL-0420190012345", issuer: "Transport Dept.", issued: addDays(t, -2000), expiry: addDays(t, 1400), location: "Wallet", notes: "", pinned: false },
      { id: uid(), title: "Health insurance policy", kind: "Insurance", reference: "HP-55120983", issuer: "Insurer", issued: addDays(t, -327), expiry: addDays(t, 38), location: "Email + home file", notes: "Family floater, ₹10L cover.", pinned: true },
      { id: uid(), title: "Car registration", kind: "Vehicle", reference: "DL 3C AB 1234", issuer: "RTO", issued: "", expiry: addDays(t, -6), location: "Glovebox", notes: "Pollution certificate also expired.", pinned: false },
      { id: uid(), title: "Tax ID card", kind: "Finance", reference: "ABCDE1234F", issuer: "Income Tax Dept.", issued: "", expiry: "", location: "Home file", notes: "", pinned: false },
      { id: uid(), title: "Blood group & allergies", kind: "Medical", reference: "O+", issuer: "", issued: "", expiry: "", location: "", notes: "No known allergies.", pinned: false },
    ];

    // ----- Cases -----
    const N = CX.caseNode, L = CX.caseLink;
    {
      const q = N("question", 0, 0, "Who took the watch from the study?", "Grandfather's Omega, last seen Sunday 22:00 on the desk.", { starred: true });
      const e1 = N("evidence", -340, -150, "Window unlatched", "Study window found unlatched Monday 07:30. No marks on the frame.");
      const e2 = N("evidence", -340, 40, "Courier visit", "Courier signed in at 14:10 Sunday, left 14:25. Never entered the study (per housekeeper).");
      const e3 = N("evidence", -340, 220, "Pawn shop listing", "Similar watch listed online Tuesday.", { url: "https://example.com/listing" });
      const p1 = N("person", 340, -190, "Housekeeper", "15 years with the family. Had keys to every room.");
      const p2 = N("person", 340, 0, "Nephew Arjun", "Visited Sunday evening. Mentioned debts last month.");
      const p3 = N("person", 340, 190, "The courier", "Only in the hallway.");
      const th = N("note", 680, -10, "Working theory", "Arjun took it during his visit and opened the window to point at an outsider.");
      s.cases.push({ id: uid(), title: "The missing watch", kind: "Investigation", status: "open", question: "Who took the watch from the study?", notes: "Insurance claim deadline in 30 days.", verdict: "", created: addDays(t, -5), updated: addDays(t, -1),
        nodes: [q, e1, e2, e3, p1, p2, p3, th],
        links: [L(e1, q, "leads"), L(e2, q, "leads"), L(e3, q, "leads"), L(q, p1), L(q, p2), L(q, p3), L(e2, p3, "contradicts", "alibi"), L(p2, th, "supports", "motive: debts"), L(e1, th, "supports", "staged?")],
        view: { x: 0, y: 0, z: 1 } });
    }
    {
      const q = N("question", 0, 0, "Anniversary gift", "Budget ₹15,000. Something memorable, not just expensive.", { starred: true });
      const c = N("note", -340, 0, "What I know", "Loves experiences over things.\nMentioned pottery in March.\nHas been stressed at work — needs a break.");
      const o1 = N("option", 340, -210, "Weekend in Udaipur", "Lake-view hotel, two nights.\n+ A real break\n− Needs leave approval", { price: 14000, rating: 5 });
      const o2 = N("option", 340, -10, "Vintage watch", "+ Lasts forever\n− Very 'thing', not experience", { price: 12000, rating: 3 });
      const o3 = N("option", 340, 190, "Pottery class for two", "Six weekends.\n+ Shared hobby, she mentioned it", { price: 6500, rating: 4 });
      const v = N("verdict", 680, -10, "Decision", "");
      s.cases.push({ id: uid(), title: "Anniversary gift", kind: "Gift", status: "open", question: "What should I give for our anniversary?", notes: "Anniversary is in 3 weeks.", verdict: "", created: addDays(t, -3), updated: t,
        nodes: [q, c, o1, o2, o3, v], links: [L(c, q, "leads"), L(q, o1), L(q, o2), L(q, o3), L(c, o3, "supports", "mentioned in March"), L(c, o1, "supports", "needs a break")], view: { x: 0, y: 0, z: 1 } });
    }
    {
      const q = N("question", 0, 0, "Spring trip destination");
      const o1 = N("option", 340, -100, "Lisbon", "Mild weather, food, walkable.", { price: 90000, rating: 5 });
      const o2 = N("option", 340, 80, "Istanbul", "Great but busier in April.", { price: 75000, rating: 4 });
      const v = N("verdict", 680, -100, "Verdict", "Lisbon, 10 days in April.", { starred: true });
      s.cases.push({ id: uid(), title: "Where to go in spring", kind: "Planning", status: "solved", question: "Where should we travel in April?", notes: "", verdict: "Lisbon, 10 days in April.", created: addDays(t, -40), updated: addDays(t, -30),
        nodes: [q, o1, o2, v], links: [L(q, o1), L(q, o2), L(o1, v, "leads", "chosen")], view: { x: 0, y: 0, z: 1 } });
    }

    return CX.normalize(s);
  };
})();
