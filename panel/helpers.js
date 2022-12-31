
exports.helpers = {
    toLocal: function(date) {
        return new Date(date).toLocaleString();
    },
    isOnline: function(date) {
        if ((Date.now() - date) < 6 * 60 * 1000) {
            return '<div id="online"></div>';
        }
        return '<div id="offline"></div>';
    }
}