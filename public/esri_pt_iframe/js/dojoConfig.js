var localPath = location.pathname.replace(/\/[^/]*$/, '');
var dojoConfig = {
    async: true,
    packages: [
        { name: 'esript', location: localPath + '/js' },
    ]
};
