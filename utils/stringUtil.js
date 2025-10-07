
class StringUtil {

    replaceAll(string, characterToReplace, replacement) {
        return string.split(characterToReplace).join(replacement);
    }
}

 let stringUtil = new StringUtil();

 module.exports = stringUtil;
 