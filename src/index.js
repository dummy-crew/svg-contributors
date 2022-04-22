const fs = require('fs');
const { Octokit } = require('octokit');
const octokit = new Octokit();

const OCTOKIT_PAGE_LIMIT = 100;

function getRepoContributors(owner, repo, limit = 30, includeBots = false) {
  // Lists contributors to the specified repository and sorts them by the number of commits per contributor in descending order.
  const data = Promise.all(paginateContributors(owner, repo, limit)).then((data) => {
    const flatData = data.flat();
    if (!includeBots) {
      return flatData.filter((contributor) => {
        return !(contributor.name.endsWith('[bot]') || contributor.name.endsWith('-bot'));
      });
    }
    return flatData;
  });

  return data;
}

function paginateContributors(owner, repo, pageLimit) {
  const tailPageLimit = pageLimit % OCTOKIT_PAGE_LIMIT;
  const fullPages = pageLimit - tailPageLimit;
  const lastPage = fullPages / OCTOKIT_PAGE_LIMIT + 1;
  const requests = [];

  for (let i = OCTOKIT_PAGE_LIMIT; i <= fullPages; i += OCTOKIT_PAGE_LIMIT) {
    const response = octokit.rest.repos.listContributors({
      owner,
      repo,
      per_page: OCTOKIT_PAGE_LIMIT,
      page: i / OCTOKIT_PAGE_LIMIT,
    });
    const chainedResponse = handleResponse(response);
    requests.push(chainedResponse);
  }
  if (tailPageLimit !== 0) {
    const tailResponse = handleResponse(
      octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: OCTOKIT_PAGE_LIMIT,
        page: lastPage,
      }),
    ).then((res) => {
      return res.slice(0, tailPageLimit);
    });

    requests.push(tailResponse);
  }
  return requests;
}

function handleResponse(requestPromise) {
  return requestPromise
    .then((res) => {
      const contributors = res.data.map((user) => {
        return {
          name: user.login,
          avatar_url: `https://avatars.githubusercontent.com/u/${user.id}?s=60&v=4`,
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
}

function generateSvg(contributors, avatarSize = 60, columns = 10) {
  const IMG_WIDTH = avatarSize > 460 ? 460 : avatarSize;
  const IMG_HEIGHT = avatarSize > 460 ? 460 : avatarSize;
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
      const dataURI = await convertImageToDataURI(user.avatar_url, avatarSize);
      return `
      <svg x="nextX" y="nextY">
        <a href="https://github.com/${user.name}" target="_blank">
            <title>${user.name}</title>
          <image href="${dataURI}" height="${IMG_HEIGHT}" width="${IMG_WIDTH}"  clip-path="url(#clip)" />
        </a>
      </svg>
        `;
    }),
  ).then((svgList) => {
    const rows = Math.ceil(contributors.length / columns);
    const width = columns * IMG_WIDTH + (columns + 1) * MARGIN;
    const height = rows * IMG_HEIGHT + (rows + 1) * MARGIN;

    svgList.forEach((userSvg, index) => {
      const nextX = (index % columns) * (IMG_WIDTH + MARGIN);
      const nextY = Math.floor(index / columns) * (IMG_HEIGHT + MARGIN);
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

function convertImageToDataURI(url, avatarSize) {
  return new Promise((resolve, reject) => {
    const request = require('request');
    request.get(url.replace(/\?s=\d+/, `?s=${avatarSize}`), { encoding: null }, (err, res, body) => {
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
