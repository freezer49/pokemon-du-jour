// historique depuis localStorage
let historique = JSON.parse(localStorage.getItem("historique")) || [];

// traduction des types en français
const typesFR = {
  normal: "Normal",
  fire: "Feu",
  water: "Eau",
  grass: "Plante",
  electric: "Électrik",
  ice: "Glace",
  fighting: "Combat",
  poison: "Poison",
  ground: "Sol",
  flying: "Vol",
  psychic: "Psy",
  bug: "Insecte",
  rock: "Roche",
  ghost: "Spectre",
  dragon: "Dragon",
  dark: "Ténèbres",
  steel: "Acier",
  fairy: "Fée",
};

// récupérer les éléments du HTML
const throwButton = document.querySelector("#btn");
const btnRelancer = document.querySelector("#btn-relancer");
const picture = document.querySelector("#pokemon-image");
const pokemonName = document.querySelector("#pokemon-name");
const type = document.querySelector("#pokemon-type");
const message = document.querySelector("#pokemon-message");
const slotframe = document.querySelector("#slot-frame");
const flipWrapper = document.querySelector("#flip-wrapper");

// messages depuis JSON
let messages = {};
async function loadMessages() {
  const response = await fetch(`./messages.json`);
  const data = await response.json();
  messages = data;
}
loadMessages();

// affiche le point d'interrogation initial dans la roulette
function showSlotQuestion() {
  slotframe.innerHTML = `
    <span class="card-corner tl">✦</span>
    <span class="card-corner tr">✦</span>
    <span class="card-corner bl">✦</span>
    <span class="card-corner br">✦</span>
    <div class="slot-question">
      <p class="slot-question-header">✦ CARTE DU JOUR ✦</p>
      <p class="slot-question-mark">?</p>
      <p class="slot-question-stars">✦ ✦ ✦</p>
    </div>
  `;
}

// état initial
showSlotQuestion();

// affiche la grille historique
function renderHistorique() {
  const grid = document.querySelector("#history-grid");

  if (historique.length === 0) {
    grid.innerHTML = `<p class="history-empty">Aucun pokémon tiré pour l'instant...</p>`;
    return;
  }

  grid.innerHTML = historique
    .map(
      (pokemon) => `
    <div class="history-card">
      <span class="card-corner tl">✦</span>
      <span class="card-corner tr">✦</span>
      <span class="card-corner bl">✦</span>
      <span class="card-corner br">✦</span>
      <p class="card-header-small">✦ CARTE DU JOUR ✦</p>
      <img src="${pokemon.image}" />
      <p class="h-name">${pokemon.name}</p>
      <p class="h-type">${pokemon.type}</p>
      <div class="h-line"></div>
      <p class="h-msg">${pokemon.message}</p>
      <p class="h-stars">✦ ✦ ✦</p>
    </div>
  `,
    )
    .join("");
}

// affiche l'historique au chargement
renderHistorique();

// fetch un pokémon aléatoire
async function getRandomPokemon() {
  throwButton.disabled = true;
  const randomId = Math.floor(Math.random() * 898) + 1;
  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${randomId}`,
    );
    if (!response.ok) throw new Error("Pokémon introuvable");
    const data = await response.json();

    // fetch le nom français depuis l'API species
    const speciesResponse = await fetch(data.species.url);
    const speciesData = await speciesResponse.json();
    const frenchNameObj = speciesData.names.find(
      (n) => n.language.name === "fr",
    );
    data.frenchName = frenchNameObj ? frenchNameObj.name : data.name;

    startSlot(data);
    return data;
  } catch (error) {
    console.log(error.message);
    throwButton.disabled = false;
  }
}

// animation de défilement
function startSlot(finalData) {
  // vide le slot et lance l'animation
  slotframe.innerHTML = "";
  const slotImg = document.createElement("img");
  slotframe.appendChild(slotImg);

  // défilement rapide
  const interval = setInterval(() => {
    const randomId = Math.floor(Math.random() * 898) + 1;
    slotImg.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${randomId}.png`;
  }, 150);

  // arrêt après 2 secondes — affiche le bon sprite
  setTimeout(() => {
    clearInterval(interval);
    slotImg.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${finalData.id}.png`;

    // attend 1 seconde puis flip vers la carte
    setTimeout(() => {
      // type traduit en français
      const typeFR =
        typesFR[finalData.types[0].type.name] || finalData.types[0].type.name;

      // remplit la carte — extrait le nom depuis le message
      const msgText = messages[finalData.id.toString()];
      const nameFromMsg = msgText.split(",")[0].replace("Comme ", "");
      pokemonName.textContent = nameFromMsg;
      type.textContent = typeFR;
      message.textContent = messages[finalData.id.toString()];
      picture.src = finalData.sprites.other["official-artwork"].front_default;

      // flip : roulette → carte
      flipWrapper.style.transform = "rotateY(180deg)";
      throwButton.style.display = "none";
      btnRelancer.style.display = "block";

      // sauvegarde dans l'historique
      historique.push({
        id: finalData.id,
        name: nameFromMsg,
        type: typeFR,
        message: messages[finalData.id.toString()],
        image: finalData.sprites.other["official-artwork"].front_default,
      });
      localStorage.setItem("historique", JSON.stringify(historique));

      // met à jour la grille historique
      renderHistorique();

      throwButton.disabled = false;
    }, 1000);
  }, 2000);
}

// bouton lancer
throwButton.addEventListener("click", async () => {
  await getRandomPokemon();
});

// bouton relancer — flip retour vers la roulette
btnRelancer.addEventListener("click", () => {
  flipWrapper.style.transform = "rotateY(0deg)";
  btnRelancer.style.display = "none";
  throwButton.style.display = "block";

  // remet le "?" une fois le flip terminé
  setTimeout(() => {
    showSlotQuestion();
  }, 900);
});

// onglets
const tabRoulette = document.querySelector("#tab-roulette");
const tabHistorique = document.querySelector("#tab-historique");
const sectionRoulette = document.querySelector("#section-roulette");
const sectionHistorique = document.querySelector("#section-historique");

tabRoulette.addEventListener("click", () => {
  sectionRoulette.style.display = "flex";
  sectionHistorique.style.display = "none";
  tabRoulette.classList.add("active");
  tabHistorique.classList.remove("active");
});

tabHistorique.addEventListener("click", () => {
  sectionRoulette.style.display = "none";
  sectionHistorique.style.display = "block";
  tabRoulette.classList.remove("active");
  tabHistorique.classList.add("active");
  window.scrollTo(0, 0);
});
