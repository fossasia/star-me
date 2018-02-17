var parser = new DOMParser();

function getUserData(user) {
    return fetch("user").then(a => a.text()).then(function(txt) {
        var htmlDoc = parser.parseFromString(txt, "text/html");
        return [].map.call(htmlDoc.getElementById('portfolio-user-links').getElementsByTagName('li'), function(a) {
            var h = a.getElementsByTagName('a')[0];
            return {
                name: a.children[0].className,
                str: a.innerText.trim(),
                href: h ? h.href : ""
            }
        })
    }).catch(console.log)
}

function getParticipants(nameFromHackathon, i) {
    return fetch("https://" + nameFromHackathon + ".devpost.com/participants?page=" + i, {
        headers: {
            Accept: "text/html, */*; q=0.01",
            "X-Csrf-Token": "Mi2DOJ2BcnS1YZYg+kMNAM9gPRePOt8QtwhCvyjZx9JzDuI2QlwF+0AitR1h50gYhaqYLNMAVHQZmZniMhKAKQ==",
            "X-Requested-With": "XMLHttpRequest"
        }
    }).then(a => a.text()).then(txt => parser.parseFromString(txt, "text/html")).then(function(document) {
        var participantLinks = [].map.call(document.getElementsByClassName('participant'), function(e) {
            return e.getElementsByTagName('a')[0].href
        });
        var p;
        if (participantLinks.length) {
            p = new Promise(function(resolve, reject) {
                getParticipants(nameFromHackathon, i + 1).then(function(p) {
                    resolve(participantLinks.concat(p))
                })
            })
        }
        return p ? p : Promise.resolve(participantLinks);
    })
}
