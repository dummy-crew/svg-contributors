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
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" width="812" height="472">`;

  // for round corner
  svg += `<clipPath id="clip" clipPathUnits="objectBoundingBox">
              <rect ry="0.5" width="1" height="1" fill="black" />
            </clipPath>
            `;

  let distanceX = 68;
  let distanceY = 0;
  let index = 0;
  let line = 0;

  contributors.forEach((user) => {
    let nextX = index * distanceX;
    if (nextX / 11 === 68) {
      line++;
      index = -1;
      // create new line
      if (line >= 2) {
        distanceY += 68;
      }
    }
    svg += `
          <svg x="${nextX}" y="${distanceY}">
            <a href="https://github.com/${user.name}" target="_blank">
                <title>${user.name}</title>
              <image href="${user.avatar_url}" height="64" width="64"  clip-path="url(#clip)" />
            </a>
          </svg>
            `;
    index++;
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
