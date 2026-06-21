/* =========================================================================
   data.js — the family facts. Edit names here and the whole site updates.
   (Reza/Zain: tweak anything below; the family tree is a starting point your
    family can confirm + extend right on the site.)
   ========================================================================= */
window.SITE = window.SITE || {};

/* ---- Live AI backend (Cloudflare Worker). Paste your deployed Worker URL here
   to switch on the live, open-source AI for jokes + Ask Munaf.
   e.g. "https://ask-munaf.YOURNAME.workers.dev". Empty = AI not connected yet. */
window.SITE.workerUrl = "/api/ask";

/* ---- The man + immediate family (corrected spellings) ---- */
window.SITE.people = {
  dad:  { full: "Munaf Abdulrasul Velji Shamji", name: "Munaf", title: "Dr. Munaf Shamji" },
  wife: { full: "Tasnim Shamji", name: "Tasnim", aka: "Tasha", maiden: "Esmail" },
  sons: [
    { full: "Zain Munaf Abdulrasul Velji Shamji", name: "Zain" },
    { full: "Reza Munaf Abdulrasul Velji Shamji", name: "Reza" }
  ],
  father: "Abdulrasul Shamji",
  mother: "Mumtaz Shamji",
  grandfather: "Velji Shamji"
};

/* ---- Contacts for the "send to the family" tools ----
   These are kept here so the site can pre-fill a message. On a PUBLIC repo
   they are viewable — consider a private repo. Edit freely. */
window.SITE.contacts = [
  { name: "Reza",   phone: "+13109255710", email: "rezamshamji@gmail.com" },
  { name: "Mom (Tasnim)", phone: "+13109805659", email: "zshamji@msn.com" },
  { name: "Zain",   phone: "+12135509229", email: "zainshamji@theheartmedicalgroup.com" }
];

/* ---- Songs he loves (curated; links open Spotify / YouTube search) ---- */
window.SITE.songs = [
  { title: "Unstoppable", artist: "Sia", note: "His anthem — and ours for him." },
  { title: "Wonder", artist: "Tony Ann", note: "" },
  { title: "Icarus", artist: "Tony Ann", note: "" },
  { title: "Experience", artist: "Ludovico Einaudi", note: "" },
  { title: "Spring Is Coming", artist: "Maroon (Morunas)", note: "" },
  { title: "1 + 1", artist: "Naïka", note: "He loves this one." },
  { title: "Break My Heart", artist: "Dua Lipa", note: "" },
  { title: "Snowman", artist: "Sia", note: "Any Sia, really." }
];
// the "play our song" track. Add the YouTube video id to play it IN the page
// (otherwise the button opens the song on YouTube). e.g. youtubeId: "cxjvTXo9WWM"
window.SITE.anthem = { title: "Unstoppable", artist: "Sia", youtubeId: "YaEG2aWJnZ8" };

/* ---- The family tree. Each node: { name, sub?, partner?, highlight?, children? }
   Three branches + the central family. The family can add/confirm via the site. */
window.SITE.familyTree = {
  paternal: {
    label: "The Shamji side",
    root: {
      name: "Velji Shamji", sub: "Great-grandfather",
      children: [
        {
          name: "Abdulrasul Shamji", sub: "Grandfather", partner: "Mumtaz Shamji",
          children: [
            {
              name: "Munaf Abdulrasul Velji Shamji", sub: "Dad ❤", highlight: true,
              partner: "Tasnim (Tasha) Shamji · née Esmail",
              children: [
                { name: "Zain Shamji", sub: "Son" },
                { name: "Reza Shamji", sub: "Son" }
              ]
            },
            { name: "Azmina Kanji", sub: "Dad's sister" },
            { name: "Altaf Shamji", sub: "Dad's brother" }
          ]
        },
        {
          name: "Madaat Shamji", sub: "Grandfather's brother", partner: "Rozina Shamji",
          children: [
            { name: "Simin Shamji", partner: "Tim O'Brien", children: [
              { name: "Yasmeen O'Brien" }, { name: "Safiya O'Brien" }, { name: "Samir O'Brien" }
            ]},
            { name: "Shahad Shamji", partner: "Salimah", children: [ { name: "Safa Shamji" } ]},
            { name: "Saira Shamji", children: [ { name: "Keyan Rahim" } ]}
          ]
        },
        {
          name: "Abdulrasul's brother", sub: "Grand-uncle",
          children: [
            { name: "Nagib Shamji" },
            { name: "Alim Shamji", partner: "Naheed", children: [
              { name: "Faiz Shamji" }, { name: "Inara Shamji" }
            ]}
          ]
        }
      ]
    }
  },
  maternal: {
    label: "Dad's mother's side · Sunderji",
    root: {
      name: "The Sunderji sisters", sub: "Dad's mother & her sisters",
      children: [
        { name: "Mumtaz Shamji", sub: "Dad's mother · née Sunderji", highlight: true },
        { name: "Kulsum", sub: "Mumtaz's sister · née Sunderji", children: [
          { name: "Salimah Davidson", sub: "Notre Dame volleyball coach 🏐", children: [
            { name: "Josh", sub: "Kulsum's grandson — football ⚡" }
          ]}
        ]},
        { name: "Gulzaar", sub: "Mumtaz's sister · née Sunderji", partner: "Sadru Juma", children: [
          { name: "Aly Juma" }, { name: "Mahmoud Juma" }
        ]},
        { name: "Mumtaz's brother", children: [
          { name: "Teymour", partner: "Martina" }
        ]}
      ]
    }
  },
  wife: {
    label: "Mom's side · Esmail",
    root: {
      name: "Tajdin Esmail & Parviz", sub: "Nanu & Nani",
      children: [
        { name: "Tasnim (Tasha) Shamji", sub: "Mom ❤ · née Esmail", highlight: true },
        { name: "Ashianna Esmail", partner: "Theresa Esmail · née Moore", children: [
          { name: "Maya Esmail" }
        ]},
        { name: "Shahinoor 'Noonoo' Esmail", partner: "Karim Damji", children: [
          { name: "Qasim Damji" }, { name: "Tahir Damji" }, { name: "Bekim Damji" }
        ]},
        { name: "Tajdin's brother", sub: "Nanu's brother", children: [
          { name: "Zahara Ramji" }, { name: "Riz Ramji" }
        ]},
        { name: "Adil Esmail", partner: "Anisa", children: [
          { name: "Mischa" }, { name: "Zubin" }
        ]}
      ]
    }
  }
};
