// Chargement du fichier models sauces
const Sauce = require('../models/sauces');
// Chargement du package filesystem permet de modifier me systeme de fichiers notament la suppression
const fs = require('fs');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

function getUser (req) {
    // donne pour valeur a token tout ce qu il y a apres le premiers espace du contenu d'authorization
    const token = req.headers.authorization.split(' ')[1];
    // dechiffre le token a l'aide de la clé secrete et du token presant dans authorization
    const decodedToken = jwt.verify(token, `${process.env.MY_TOKEN}`);
    //console.log(decodedToken);
    // Récuperation de l'userId presente dans l'objet decodedToken
    const userId = decodedToken.userId;
    return userId;
}
// exports.getOneSauce = (req, res, next) => {
//     Sauce.findOne({ _id: req.params.id })
//         .then(sauce => res.status(200).json(sauce))
//         .catch(error => res.status(400).json({ error }));
// }

exports.getOneSauce = async (req, res, next) => {
    try {
        // la methode findOne charge la sauce en fonction de l'id dans la req.params
        const sauce = await Sauce.findOne({ _id: req.params.id});
        res.status(200).json(sauce);
    } catch (err) {
        res.status(400).json({ error: error});
    }
}

// exports.getAllSauce = (req, res, next) => {
//     Sauce.find()
//         .then(sauces => res.status(200).json(sauces))
//         .catch(error => res.status(400).json({ error }));
// }

exports.getAllSauce = async (req, res, next) => {
    try {
        //La methode find renvoie un tableau contenant tous les sauces
        const sauce = await Sauce.find({});
        res.status(200).json(sauce);
    } catch (error) {
        res.status(400).json({ error: error});
    }
}

// exports.createSauce = (req, res, next) => {
//     const sauceObject = JSON.parse(req.body.sauce);
//     delete sauceObject._id;
//     const sauce = new Sauce({
//         ...sauceObject,
//         likes: 0,
//         dislikes: 0,
//         imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
//     });
//     sauce.save()
//         .then(() => res.status(201).json({ message: 'Sauce enregistré' }))
//         .catch(error => res.status(400).json({ error }));
// }

exports.createSauce = async (req, res, next) => {
    try {
         // cree un objet json contenant les caractéristiques de la sauce crée
         const sauceObject = JSON.parse(req.body.sauce);
         // Supprime le faux id envoyer par la front ( mongoose créer un _id automatically)
         delete sauceObject._id;
         // crée la nouvelle sauce 
        const sauce = new Sauce({
            // spread (...) fait une copie tous les elements de sauceObject
            ...sauceObject,
            // Url complete de notre image, req.protocol permet d optenir le http, req.get('host') la partie serveur
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        });
        console.log(sauce);
        console.log(sauceObject);
        // Option 1 Si un des elements est false renvoie une erreur
        if (
            !sauceObject.userId ||
            !sauceObject.name ||
            !sauceObject.manufacturer ||
            !sauceObject.description ||
            !sauceObject.mainPepper ||
            !sauceObject.heat ||
            !sauce.imageUrl
            ) {
                return res.status(400).json({ error : "Il manque des elements a renseigner dans la sauce"});
        } else {
            // Sauvegarde la sauce dans la BDD
            await sauce.save();
            res.status(201).json({ message: 'Sauce enregistré' });
        }
        // Option 2 Boucle sur chaque element de sauceObject si null renvoie une erreur 
        // for (const key in sauceObject) {
        //     if(key == null) {
        //         return res.status(400).json({ error : "Il manque des elements a renseigner dans la sauce"});
        //     } else {
        //         //Sauvegarde la sauce dans la BDD
        //         await sauce.save();
        //         res.status(201).json({ message: 'Sauce enregistré' });
        //     }
        // }
    } catch (error) {
        res.status(400).json({ error : error});
    }
}

// exports.modifySauce = (req, res, next) => {
//     const sauceObject = req.file ?
//         {
//             ...JSON.parse(req.body.sauce),
//             imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
//         } : { ...req.body };
//     // if (req.file) {
//     //     const sauceObject = {
//     //         ...JSON.parse(req.body.sauce),
//     //         imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
//     //     }
//     // } else {
//     //     const sauceObject = {
//     //         ...req.body
//     //     };
//     // }
//     Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
//         .then(() => res.status(200).json({ message: 'Sauce modifié ' }))
//         .catch(error => res.status(400).json({ error }));
// }

exports.modifySauce = async (req, res, next) => {
    try {
        // charge la sauce en fonction de l'id dans la req.params
        const sauceExist = await Sauce.findOne({ _id: req.params.id });
        if (sauceExist) {
            if (sauceExist.userId === getUser(req)) {
                // sauceObject a pour valeur req.body
                const sauceObject = req.body;
                console.log("reqbody");
                console.log(sauceObject);
                // si req.file existe 
                if (req.file) {
                    // on recupere les carac de la sauce et on traite la nouvelle image
                    const sauceObject = {
                        ...JSON.parse(req.body.sauce),
                        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
                    };
                } else {
                    // sinon on recupere juste les caractéristiques
                    const sauceObject = {
                        ...req.body
                    };
                }
                // on met a jour la sauce avec les nouveaux params qui va ecrasser l ancienne
                const sauce = await Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id });
                res.status(201).json({ message: 'Sauce modifié ' });
            } else {
                throw new Error("Mauvais droit");
            }
        } else {
            throw new Error("La sauce n'existe pas");
        }


    } catch (error) {
        res.status(400).json({ error });
    }
}

// exports.deleteSauce = (req, res, next) => {
//     Sauce.findOne({ _id: req.params.id })
//         .then(sauce => {
//             const filename = sauce.imageUrl.split('/images/')[1];
//             fs.unlink(`images/${filename}`, () => {
//                 Sauce.deleteOne({ _id: req.params.id })
//                     .then(() => res.status(200).json({ message: 'Sauce supprimé ' }))
//                     .catch(error => res.status(400).json({ error }))
//             })
//         })
//         .catch(error => res.status(500).json({ error }));
// }


exports.deleteSauce = async (req, res, next) => {
    try {
        // charge la sauce en fonction de l'id dans la req.params
        const sauce = await Sauce.findOne({ _id: req.params.id });
        if (sauce) {
            if (sauce.userId === getUser(req)) {
                console.log('test');
                // separation du nom du fichier a partir du segment images
                const filename = sauce.imageUrl.split('/images/')[1];
                // suppression de l'image avec la méthode unlink dans le dossier images
                fs.unlink(`images/${filename}`, async () => {
                    // Supprime la sauce qui a pour id le contenu de req.params
                    const sauce = await Sauce.deleteOne({ _id: req.params.id })
                    res.status(200).json({ message: 'Sauce supprimé ' })
                });
            } else {
                throw new Error("Mauvais droit");
            }

        } else {
            throw new Error("La sauce n'existe pas");
        }    
    } catch (error) {
        res.status(400).json({ error });
    }
}

// exports.likeSauce = (req, res, next) => {
//     Sauce.findOne({ _id: req.params.id })
//         .then( (sauce) => {
//             // Si usersLiked est false et like = 1, l'utilisateur aime (= like) la sauce
//             if (!sauce.usersLiked.includes(req.body.userId) && req.body.like === 1) {
//                 // maj de la sauce
//                 Sauce.updateOne({ _id: req.params.id },
//                     { 
//                         $inc : {likes: 1},
//                         $push : {usersLiked: req.body.userId}
//                     }
//                 )
//                 .then(() => res.status(201)).json({ message: "like ajouté"})
//                 .catch((error) => res.status(400).json({ error: "1" }));
//             } 
//             // Si usersLiked est true like = 0, l'utilisateur annule son like
//             else if (sauce.usersLiked.includes(req.body.userId) && req.body.like === 0) {
//                 // maj de la sauce
//                 Sauce.updateOne({ _id: req.params.id },
//                     { 
//                         $inc : {likes: -1, dislikes: -1},
//                         $pull : {usersLiked: req.body.userId, usersDisliked: req.body.userId}
//                     }
//                 )
//                 .then(() => res.status(201)).json({ message: "like ajouté"})
//                 .catch((error) => res.status(400).json({ error: "2" }));
//             }
//             // Si usersDisliked est false et like = -1, l'utilisateur n'aime pas (=dislike) la sauce.
//             else if (!sauce.usersDisliked.includes(req.body.userId) && req.body.like === -1) {
//                 // maj de la sauce
//                 Sauce.updateOne({ _id: req.params.id },
//                     { 
//                         $inc : {dislikes: 1},
//                         $push : {usersDisliked: req.body.userId}
//                     }
//                 )
//                 .then(() => res.status(201)).json({ message: "Dislake ajouté"})
//                 .catch((error) => res.status(400).json({ error: "3" }));
//             }
//         })
//         .catch((error) => res.status(400).json({ error: "5" }));
// }
exports.likeSauce = async (req, res, next) => {
    try {
        // charge la sauce en fonction de l'id dans la req.params
        const sauce = await Sauce.findOne({ _id: req.params.id });
        console.log(sauce);
        console.log(req.body);
        if (sauce) {
            //Si usersLiked est false et like = 1, l'utilisateur aime (= like) la sauce
            if (!sauce.usersLiked.includes(req.body.userId) && req.body.like === 1) {
                const like = await Sauce.updateOne(
                    { _id: req.params.id},
                    { 
                        $inc : {likes: 1},
                        $push : {usersLiked: req.body.userId}
                    }
                )
            }
            // Si usersDisliked est false et like = -1, l'utilisateur n'aime pas (=dislike) la sauce.
            if (!sauce.usersDisliked.includes(req.body.userId) && req.body.like === -1) {
                const dislike = await Sauce.updateOne(
                    { _id: req.params.id},
                    { 
                        $inc : {dislikes: 1},
                        $push : {usersDisliked: req.body.userId}
                    }
                )
            }

            // Si like = 0, l'utilisateur annule son like ou dislike
            if (sauce.usersLiked.includes(req.body.userId) && req.body.like === 0) {
                const nolike = await Sauce.updateOne(
                    { _id: req.params.id},
                    { 
                        // inc incrémente une valeur
                        $inc : {likes: -1},
                        // pull retire un elements array
                        $pull : {usersLiked: req.body.userId}
                    }
                )
            }
            //
            if (sauce.usersDisliked.includes(req.body.userId) && req.body.like === 0) {
                const nolike = await Sauce.updateOne(
                    { _id: req.params.id},
                    { 
                        $inc : {dislikes: -1},
                        $pull : {usersDisliked: req.body.userId}
                    }
                )
            }
            res.status(201).json({ message: 'choix modifié'});
        } else {
            throw new Error("La sauce n'existe pas");
        } 
    } catch (error) {
        res.status(400).json({ error});
    }
}