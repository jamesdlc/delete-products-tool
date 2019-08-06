const Parse = require("parse/node");
const PARSE_APP_ID = process.env.PARSE_APP_ID || "";
const PARSE_JS_CLIENT_ID = process.env.PARSE_CLIENT_ID || "";
const PARSE_MASTER_KEY = process.env.PARSE_MASTER_KEY;
const VENDOR_ID = process.env.VENDOR_ID;
const PARSE_URL = process.env.PARSE_URL;

let querySize = 50;
let successfulSaveCounter = 0;
let errorSaveCounter = 0;

Parse.initialize(PARSE_APP_ID, PARSE_JS_CLIENT_ID, PARSE_MASTER_KEY);
Parse.serverURL = PARSE_URL;

let getProducts = () => {
  let Product = Parse.Object.extend("Product");
  let productQuery = new Parse.Query(Product);

  productQuery.equalTo("vendorId", VENDOR_ID);
  productQuery.doesNotExist("deletedAt");
  productQuery.limit(querySize);
  productQuery.count(
    productCount => {
      console.log(
        "Found " + productCount + " " + VENDOR_ID + " Product entries"
      );
      productQuery.find().then(
        foundProducts => {
          let allProducts = [];
          foundProducts.forEach(product => {
            let tempProduct = {
              objectId: product.id,
              vendorId: product.get("vendorId"),
              Name: product.get("Name"),
              Color: product.get("Color"),
              Size: product.get("Size"),
              Description: product.get("Description"),
              Price: product.get("Price"),
              Condition: product.get("Condition"),
              Type: product.get("Type"),
              Brand: product.get("Brand"),
              parcel: product.get("parcel"),
              vendorProductId: product.get("vendorProductId"),
              Seller: product.get("Seller"),
              createdAt: product.get("createdAt"),
              updatedAt: product.get("updatedAt")
            };
            allProducts.push(tempProduct);
          });

          var softDeleteProducts = products => {
            var softDeleteQuery = new Parse.Query(Product);
            softDeleteQuery.equalTo("objectId", products[0].objectId);
            var now = new Date();
            softDeleteQuery.first({
              success: foundProduct => {
                foundProduct.set("deletedAt", now);
                foundProduct.set("Description", products[0].Description);
                foundProduct.set("Type", products[0].Type);
                foundProduct.set("Brand", products[0].Brand);
                foundProduct.set("Condition", products[0].Condition);
                foundProduct.set("Color", products[0].Color);
                foundProduct.set("Size", products[0].Size);
                foundProduct.set("Price", products[0].Price);
                foundProduct.set("promotedIndex", products[0].promotedIndex);
                foundProduct.set("FixedPrice", products[0].FixedPrice);
                foundProduct.set(
                  "shippingPreference",
                  products[0].shippingPreference
                );
                foundProduct.set("parcel", products[0].parcel);
                foundProduct.set("deletedReason", 1);
                foundProduct.save(null, {
                  success: savedObject => {
                    products.shift();
                    successfulSaveCounter++;
                    if (products.length > 0) {
                      if (products.length % 250 === 0) {
                        let now = new Date();
                        now = now.toLocaleString();
                        console.log("Still running. " + now);
                      }
                      softDeleteProducts(products);
                    }
                    if (products.length === 0) {
                      console.log(
                        "Successfully soft deleted",
                        successfulSaveCounter,
                        VENDOR_ID +
                          " Products. They will be removed from the Marketplace."
                      );
                      if (errorSaveCounter > 0) {
                        console.log(
                          "There were",
                          errorSaveCounter,
                          "errors during save. See logs for more details."
                        );
                      }
                      return;
                    }
                  },
                  error: (originalObject, error) => {
                    errorSaveCounter++;
                    console.log(
                      "Something went wrong while attempting to save updates to this Product.",
                      originalObject,
                      error
                    );
                  }
                });
              },
              error: productFindError => {
                console.error(
                  "Something went wrong while finding specific Product.",
                  productFindError
                );
              }
            });
          };
          console.log(
            "Starting delete. " +
              productCount +
              " " +
              VENDOR_ID +
              " Products will be soft deleted."
          );
          softDeleteProducts(allProducts);
        },
        productQueryError => {
          console.error(
            "Something went wrong while querying all Products.",
            productQueryError
          );
          return;
        }
      );
    },
    productCountErr => {
      console.log(
        "Something went wrong while getting Product count.",
        productCountErr
      );
    }
  );
};

getProducts();
