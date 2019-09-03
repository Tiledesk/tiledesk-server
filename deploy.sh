npm version patch
version=`node -e 'console.log(require("./package.json").version)'`
echo "version $version"

if [ "$version" != "" ]; then
    git tag -a "v$version" -m "`git log -1 --format=%s`"
    echo "Created a new tag, v$version"
    git push --tags
    npm publish --access public
fi


#git push heroku dev:master

heroku container:login
heroku container:push server
heroku container:release server