import * as P from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { useCallback, useState } from "react";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const collections = await admin.rest.resources.CustomCollection.all({ session });
  const arr = [...collections.data];

  for (let i = 0; i < arr.length; i++) {

    const getSpecificCollection = await admin.rest.resources.CustomCollection.find({
      session: session,
      id: arr[i]?.id,
    });

    const mapCount = arr.find((item) => item.id == getSpecificCollection.id);
    mapCount["product_count"] = getSpecificCollection.products_count;
  }

  return arr;
}

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const body = await request.formData();

  const products = JSON.parse(body.get("products"));
  const arr = [];

  for (let i = 0; i < products.length; i++) {
    arr.push({
      product_id: Number(products[i].id.replace("gid://shopify/Product/", ""))
    });
  }

  const custom_collection = new admin.rest.resources.CustomCollection({ session });
  custom_collection.title = body.get("title");
  custom_collection.collects = arr;

  await custom_collection.save({
    update: true,
  });

  return true;
}

export default function Index() {
  const submit = useSubmit();
  const data = useLoaderData();

  const [active, setActive] = useState(false);
  const handleChange = useCallback(() => setActive(!active), [active]);
  const [value, setValue] = useState('');
  const [productArr, setProductArr] = useState([]);

  const handleChangeTitle = useCallback(
    (newValue) => setValue(newValue),
    [],
  );

  const resourceName = {
    singular: 'order',
    plural: 'orders',
  };

  return (
    <P.Page
      title="Your Collections"
      fullWidth
      primaryAction={<P.Button variant="primary" onClick={handleChange}>Create a new Collection</P.Button>}
    >
      <P.Layout>
        {/* {
          data.map((collection, index) => <P.Layout.Section key={index}>
            {collection.title}
          </P.Layout.Section>)
        } */}
        <P.LegacyCard>
          <P.IndexTable
            resourceName={resourceName}
            itemCount={data.length}
            headings={[
              { title: 'Collection Name' },
              { title: 'Product Count' },
            ]}
            selectable={false}
          >
            {
              data.map((collection, index) => (
                <P.IndexTable.Row id={index} key={index} position={index}>
                  <P.IndexTable.Cell>
                    <P.Text variant="bodyMd" fontWeight="bold" as="span">
                      {collection.title}
                    </P.Text>
                  </P.IndexTable.Cell>
                  <P.IndexTable.Cell>
                    <P.Text variant="bodyMd" alignment="end" fontWeight="bold" as="span">
                      {collection.product_count}
                    </P.Text>
                  </P.IndexTable.Cell>
                </P.IndexTable.Row>
              ))
            }
          </P.IndexTable>
        </P.LegacyCard>
      </P.Layout>
      <P.Frame>
        <P.Modal
          open={active}
          onClose={handleChange}
          title="Reach more shoppers with Instagram product tags"
          primaryAction={{
            content: 'Create Collection',
            onAction: handleSubmit,
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: handleChange,
            },
          ]}
        >
          <P.Modal.Section>
            <P.TextContainer>
              <P.TextField
                label="Add Title for the new Collection"
                value={value}
                onChange={handleChangeTitle}
                autoComplete="off"
              />
              {
                productArr.length > 0 ?
                  productArr.map((product, index) =>
                    <P.InlineStack key={index} gap="400" blockAlign="center">
                      <P.Thumbnail
                        source={product.image}
                        size="large"
                        alt="Black choker necklace"
                      />
                      <P.Text variant="headingMd" as="h6">
                        {product.title}
                      </P.Text>
                    </P.InlineStack>
                  )
                  :
                  <></>
              }
              <P.Button onClick={handleAddProducts}>Add Products</P.Button>
            </P.TextContainer>
          </P.Modal.Section>
        </P.Modal>
      </P.Frame>
    </P.Page>
  );

  async function resourcePicker() {
    const response = await window.shopify.resourcePicker({
      type: "product",
      multiple: true,
      action: "select",
      filter: {
        variants: false
      }
    });

    return response;
  }

  async function handleAddProducts() {
    const products = await resourcePicker();
    const arr = [];

    for (let i = 0; i < products.length; i++) {
      arr.push({
        id: products[i].id,
        title: products[i].title,
        image: products[i]?.images[0]?.originalSrc
      });
    }

    setProductArr(arr);
  }

  async function handleSubmit() {
    if (value == "" || productArr.length == 0) alert("Please Enter a Title and Add Products for Collection creation...");
    else {
      submit({ products: JSON.stringify(productArr), title: value }, { replace: true, method: "POST" });
      handleChange();
    }
  }
}