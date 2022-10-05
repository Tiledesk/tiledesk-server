
class StringUtil {

    replaceAll(string, characterToReplace, replacement) {
        return string.split(characterToReplace).join(replacement);
    }
}

 var stringUtil = new StringUtil();

 module.exports = stringUtil;
 