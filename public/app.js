let selectedCountries = [];

function toggleCountry(id, status) {
  const svgEl = document.querySelector(`path[data-id="${id}"]`);
  if (status === false || (selectedCountries.includes(id) && !status)) {
    selectedCountries = selectedCountries.filter((country) => country !== id);
    svgEl && svgEl.classList.remove("selected");
  } else {
    selectedCountries.push(id);
    svgEl && svgEl.classList.add("selected");
  }
}

const [index10, geojson] = await Promise.all([
  fetch("/countries/10m/index.json").then((res) => res.json()),
  fetch("/countries/110m/all.geojson").then((res) => res.json()),
]);
// Make map
(async () => {
  const root = document.querySelector(".map svg");

  let projection = d3.geoEquirectangular();

  let geoGenerator = d3.geoPath().projection(projection);

  let u = d3
    .select(root)
    .attr("viewBox", "0 20 960 460")
    .selectAll("path")
    .data(geojson.features)
    .join("path")
    .attr("data-id", (feature) => {
      let a3 = feature.properties.ISO_A3;
      if (!a3 || Number(a3) === -99) {
        a3 = feature.properties.GU_A3;
      }
      return `${a3}.geojson`;
    })
    .attr("d", geoGenerator);

  root.addEventListener("click", (e) => {
    const countryId = e.target.dataset.id;
    toggleCountry(countryId);
  });
})();

// Make region selectors
(async () => {
  // Toggle all regions
  document
    .querySelector('.regions .selectagon__input[value="all"]')
    .addEventListener("click", (e) => {
      document
        .querySelectorAll('.regions .selectagon__input:not([value="all"])')
        .forEach((input) => {
          if (input.checked !== e.target.checked) {
            input.click();
          } else {
            input.click();
            input.click();
          }
        });
    });

  document.querySelectorAll(".regions input").forEach((checkbox) => {
    checkbox.addEventListener("click", (e) => {
      const regionName = e.target.value;
      const region = Object.values(
        regionName === "Other"
          ? { ...index10.Antarctica, ...index10["Seven seas (open ocean)"] }
          : index10[regionName]
      );
      region.forEach((country) => {
        toggleCountry(country, e.target.checked);
      });
    });
  });
})();

function promptDownloadString(string, fileName) {
  const blob = new Blob([string], { type: "application/json;charset=utf-8" });
  const aElement = document.createElement("a");
  aElement.setAttribute("download", fileName);
  const href = URL.createObjectURL(blob);
  aElement.href = href;
  aElement.setAttribute("target", "_blank");
  aElement.click();
  URL.revokeObjectURL(href);
}

async function download() {
  const scrim = document.querySelector(".responsive-app__scrim");
  const progressBarEl = document.querySelector(".progress__inner");
  scrim.classList.remove("responsive-app__scrim--hidden");
  scrim.style.display = "flex";
  progressBarEl.style.width = "1rem";
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const resolution = document.querySelector(
    'input[name="resolution"]:checked'
  ).value;
  const index = await fetch(`/countries/${resolution}/index.json`).then((res) =>
    res.json()
  );
  const availableKeys = Object.values(index.all);
  const downloads = selectedCountries
    .filter((filename) =>
      availableKeys.find((key) => key.filename === filename)
    )
    .map((file) => `/countries/${resolution}/${file}`);

  let downloadsCompleted = 0;
  function progress(payload) {
    downloadsCompleted++;
    const percent = (downloadsCompleted / downloads.length) * 100;
    progressBarEl.style.width = `${Math.round(percent * 100) / 100}%`;
    return payload;
  }
  const files = await Promise.all(
    downloads.map((file) =>
      fetch(file)
        .then((res) => res.json())
        .then(progress)
    )
  );
  const geojson = {
    type: "FeatureCollection",
    features: files,
  };
  const jsonString = JSON.stringify(geojson);
  promptDownloadString(jsonString, "custom.geo.json");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  scrim.classList.add("responsive-app__scrim--hidden");
}

document.querySelector(".build").addEventListener("click", () => {
  download();
});
