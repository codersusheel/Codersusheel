const fs = require("fs");

const USERNAME = "codersusheel";

// Languages you DON'T want to show
const EXCLUDED_LANGUAGES = [
  "Python"
];

async function github(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return response.json();
}

async function generate() {
  const repos = await github(
    `https://api.github.com/users/${USERNAME}/repos?per_page=100`
  );

  const languages = {};

  for (const repo of repos) {
    if (repo.fork || repo.archived) continue;

    const data = await github(
      `https://api.github.com/repos/${USERNAME}/${repo.name}/languages`
    );

    for (const [language, bytes] of Object.entries(data)) {
      if (EXCLUDED_LANGUAGES.includes(language)) continue;

      languages[language] =
        (languages[language] || 0) + bytes;
    }
  }

  const total = Object.values(languages)
    .reduce((a, b) => a + b, 0);

  const sorted = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const rows = sorted.map(([language, bytes], index) => {
    const percentage = ((bytes / total) * 100).toFixed(1);

    return `
      <text x="35" y="${115 + index * 48}"
            class="language">${language}</text>

      <rect x="35" y="${125 + index * 48}"
            width="330"
            height="8"
            rx="4"
            class="bar-bg"/>

      <rect x="35" y="${125 + index * 48}"
            width="${330 * percentage / 100}"
            height="8"
            rx="4"
            class="bar"/>

      <text x="385" y="${132 + index * 48}"
            class="percent">${percentage}%</text>
    `;
  }).join("");

  const svg = `
<svg width="450" height="430"
     viewBox="0 0 450 430"
     xmlns="http://www.w3.org/2000/svg">

<style>
  .title {
    font: 700 20px Arial;
    fill: #24292f;
  }

  .language {
    font: 600 14px Arial;
    fill: #24292f;
  }

  .percent {
    font: 500 13px Arial;
    fill: #57606a;
  }

  .bar-bg {
    fill: #d0d7de;
  }

  .bar {
    fill: #0969da;
  }

  @media (prefers-color-scheme: dark) {
    .title,
    .language {
      fill: #f0f6fc;
    }

    .percent {
      fill: #8b949e;
    }

    .bar-bg {
      fill: #30363d;
    }

    .bar {
      fill: #58a6ff;
    }
  }
</style>

<rect x="1"
      y="1"
      width="448"
      height="428"
      rx="14"
      fill="transparent"
      stroke="#30363d"/>

<text x="35"
      y="45"
      class="title">
  💻 Languages
</text>

${rows}

</svg>
`;

  fs.mkdirSync("generated", { recursive: true });

  fs.writeFileSync(
    "generated/languages.svg",
    svg.trim()
  );

  console.log("✅ languages.svg generated");
}

generate().catch(console.error);
