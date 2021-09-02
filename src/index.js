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
          avatar_url: user.avatar_url,
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
  const width = 64 * 11;
  const heigh = 70 * Math.round(contributors.length / 10) + 1;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${heigh}">`;

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
    const distance = 68;

    let x = 0;
    let y = 0;

    let nextX = x * distance;
    let nextY = y * distance;

    const maxX = 9; // max number of contributors per row

    svgList.forEach((userSvg) => {
      // end of row
      if (nextX / maxX === distance) {
        x = 0;
        y++;
      }

      nextX = x * distance;
      nextY = y * distance;

      svg += userSvg.replace('nextX', nextX).replace('nextY', nextY);

      x++;
    });
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
      // compress image
      const jimp = require('jimp');
      jimp
        .read(body)
        .then((image) => {
          return image.resize(100, 100).quality(50).getBase64Async(jimp.MIME_PNG);
        })
        .then((dataURI) => {
          resolve(dataURI);
        });
    });
  });
}

module.exports = { getRepoContributors, generateSvg, downloadSvg };
