const fs = require("fs");
const { Octokit } = require("octokit");
const octokit = new Octokit();

function getRepoContributors(owner, repo) {
  // Lists contributors to the specified repository and sorts them by the number of commits per contributor in descending order.
  const data = octokit.rest.repos
    .listContributors({
      owner,
      repo,
      per_page: 100,
    })
    .then((res) => {
      const contributors = res.data.map((user) => {
        return {
          name: user.login,
          avatar_url: user.avatar_url,
        };
      });
      if (!Array.isArray(contributors)) {
        console.log("Error: ", contributors.message);
        return [];
      }
      return contributors;
    })
    .catch((err) => {
      console.log("Error: ", err.message);
      return [];
    });
  return data;
}

function generateSvg(contributors) {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" width="100%" height="auto">`;

  // for round corner
  svg += `<clipPath id="clip" clipPathUnits="objectBoundingBox">
              <rect ry="0.5" width="1" height="1" fill="black" />
            </clipPath>
            `;

  const distance = 68;

  let x = 0;
  let y = 0;

  let nextX = x * distance;
  let nextY = y * distance;

  let maxX = 9; // max number of contributors in a row, add 1, so max it's 10

  contributors.forEach((user) => {
    // end of row
    if (nextX / maxX === distance) {
      x = 0;
      y++;
    }

    nextX = x * distance;
    nextY = y * distance;

    svg += `
          <svg x="${nextX}" y="${nextY}">
            <a href="https://github.com/${user.name}" target="_blank">
                <title>${user.name}</title>
              <image href="${user.avatar_url}" height="64" width="64"  clip-path="url(#clip)" />
            </a>
          </svg>
            `;
    x++;
  });
  svg += `</svg>`;

  return svg;
}

function downloadSvg(svg) {
  const minified = svg.replace(/\s+/g, " ");
  fs.writeFile("contributors.svg", minified, (err) => {
    if (err) throw err;
    console.log("The file has been saved!");
  });
}

module.exports = { getRepoContributors, generateSvg, downloadSvg };
