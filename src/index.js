const fs = require('fs');
const { Octokit } = require('octokit');
const octokit = new Octokit();

function getRepoContributors(owner, repo, limit = 30) {
  // Lists contributors to the specified repository and sorts them by the number of commits per contributor in descending order.
  const data = octokit.rest.repos
    .listContributors({
      owner,
      repo,
      per_page: limit,
    })
    .then((res) => {
      const contributors = res.data.map((user) => {
        return {
          name: user.login,
          avatar_url: `https://avatars.githubusercontent.com/u/${user.id}?s=100&amp;v=4`,
        };
      });
      if (!Array.isArray(contributors)) {
        console.log('Error: ', contributors.message);
        return [];
      }
      return contributors;
    })
    .catch((err) => {
      console.log('Error: ', err.message);
      return [];
    });
  return data;
}

function generateSvg(contributors) {
  const COLS_PER_ROW = 10;
  const IMG_WIDTH = 60;
  const IMG_HEIGHT = 60;
  const MARGIN = 10;

  let svg =
    '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" width="{{width}}" height="{{heigh}}">';

  // for round corner
  svg += `<clipPath id="clip" clipPathUnits="objectBoundingBox">
              <rect ry="0.5" width="1" height="1" fill="black" />
            </clipPath>
            `;

  console.log('Generating SVG...');

  const parsed = Promise.all(
    contributors.map(async (user) => {
      const dataURI = await convertImageToDataURI(user.avatar_url);
      return `
      <svg x="nextX" y="nextY">
        <a href="https://github.com/${user.name}" target="_blank">
            <title>${user.name}</title>
          <image href="${dataURI}" height="64" width="64"  clip-path="url(#clip)" />
        </a>
      </svg>
        `;
    }),
  ).then((svgList) => {
    const rows = Math.ceil(contributors.length / COLS_PER_ROW);
    const width = COLS_PER_ROW * IMG_WIDTH + (COLS_PER_ROW + 1) * MARGIN;
    const height = rows * IMG_HEIGHT + (rows + 1) * MARGIN;

    svgList.forEach((userSvg, index) => {
      const nextX = (index % COLS_PER_ROW) * (IMG_WIDTH + MARGIN);
      const nextY = Math.floor(index / COLS_PER_ROW) * (IMG_HEIGHT + MARGIN);
      svg += userSvg.replace('nextX', nextX).replace('nextY', nextY);
    });

    svg = svg.replace('{{width}}', width).replace('{{heigh}}', height);
    svg += '</svg>';

    return svg;
  });

  return parsed;
}

function downloadSvg(svg) {
  const minified = svg.replace(/\s+/g, ' ');
  fs.writeFile('contributors.svg', minified, (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
  });
}

function convertImageToDataURI(url) {
  return new Promise((resolve, reject) => {
    const request = require('request');
    request.get(url, { encoding: null }, (err, res, body) => {
      if (err) {
        console.log('Error: ', err.message);
        reject(err);
      }
      const dataURI = `data:image/png;base64,${body.toString('base64')}`;
      resolve(dataURI);
    });
  });
}

module.exports = { getRepoContributors, generateSvg, downloadSvg };
