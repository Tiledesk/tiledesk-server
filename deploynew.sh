# Check if the token is set
if [ -z "$NPM_PUBLISH_TOKEN" ]; then
  echo "⚠️ Missing NPM_PUBLISH_TOKEN in environment."
  echo "You can speed up the process by setting the environment variable with your publish token."
  read -p "Do you want to continue with manual login? (y/n): " choice
  if [[ "$choice" != "y" && "$choice" != "Y" ]]; then
    echo "❌ Deploy aborted."
    exit 1
  else
    echo "💡 Proceed with 'npm login' manually..."
    npm login
  fi
else
  # Create temporary .npmrc with the token
  echo "//registry.npmjs.org/:_authToken=${NPM_PUBLISH_TOKEN}" > ~/.npmrc
fi

git pull
npm version patch
version=`node -e 'console.log(require("./package.json").version)'`
echo "version $version"

if [ "$version" != "" ]; then
    git tag -a "$version" -m "`git log -1 --format=%s`"
    echo "Created a new tag, $version"
    git push --tags
    npm publish --access public
fi
git push

# Remove temporary .npmrc if created
if [ -f ~/.npmrc ]; then
  rm ~/.npmrc
fi

echo "🎉 Deploy completed!"