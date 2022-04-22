const arg = require('arg');
const { getRepoContributors, generateSvg, downloadSvg } = require('.');

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--owner': String,
      '--name': String,
      '--size': Number,
      '--limit': Number,
      '--columns': Number,
      '-o': '--owner',
      '-n': '--name',
      '-s': '--size',
      '-l': '--limit',
      '-c': '--columns'
    },
    {
      argv: rawArgs.slice(2),
    },
  );
  return {
    repoOwner: args['--owner'],
    repoName: args['--name'],
    avatarSize: args['--size'],
    limit: args['--limit'],
    columns: args['--columns'],
  };
}

function cli(args) {
  const parsedArgs = parseArgumentsIntoOptions(args);
  // check if have repoOwner and repoName
  if (!parsedArgs.repoOwner || !parsedArgs.repoName) {
    console.log('Please provide a repo owner and repo name');
    return;
  }
  getRepoContributors(parsedArgs.repoOwner, parsedArgs.repoName, parsedArgs.limit).then((contributors) => {
    if (contributors.length === 0) {
      console.log('No contributors found');
      return;
    }
    generateSvg(contributors, parsedArgs.avatarSize, parsedArgs.columns).then((svg) => {
      downloadSvg(svg);
    });
  });
}

module.exports = { cli };
