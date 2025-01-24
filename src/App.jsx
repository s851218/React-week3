import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Modal } from "bootstrap";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

// Modal 狀態資料欄位
const defaultModalState = {
  imageUrl: "",
  title: "",
  category: "",
  unit: "",
  origin_price: "",
  price: "",
  description: "",
  content: "",
  is_enabled: 0,
  imagesUrl: [""],
};

function App() {
  const [isAuth, setIsAuth] = useState(false); // 用於確認是否登入
  // 更新產品列表狀態
  const [products, setProducts] = useState([]);
  // 更新帳密狀態
  const [account, setAccount] = useState({
    "username": "",
    "password": "",
  });

  // 登入帳密輸入onChange監聽
  const handleInputChange = (e) => {
    const { value, name } = e.target; // e.target 的物件解構，分別為 e.target.value 是輸入欄位的當前值；e.target.name 是該輸入欄位的 name 屬性，表示這是 username 還是 password。

    // setAccount 用於更新狀態。
    setAccount({
      ...account, // 展開運算符 ...account 產生新的 account 物件，用來保留現有的 account 狀態，不會直接改變原本的物件
      [name]: value, // [name]: value 動態地更新對應的欄位：如果 name 是 "username"，就更新 username 的值為 value；如果 name 是 "password"，就更新 password 的值為 value。
    });
  };

  // 登入
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${BASE_URL}/v2/admin/signin`, account);

      const { token, expired } = res.data; // 成功登入後，將 token 和 expired 取出來，要存到 cookie
      document.cookie = `hexToken=${token}; expires=${new Date(expired)}`; // 將 token 和 expired 存到 cookie

      axios.defaults.headers.common["Authorization"] = token; // 每次發送 HTTP 請求時，預設都會將這個 token 附加在 Authorization 標頭中

      fetchProducts(); // 在登入成功後執行獲取產品列表函式

      setIsAuth(true); // 成功登入後，透過 setIsAuth 將 isAuth 狀態改成 true將 isAuth 狀態改成 true，就會渲染產品列表
    } catch (error) {
      alert("登入失敗");
      console.log("登入失敗：", error);
    }
  };

  // 獲取產品列表函式
  const fetchProducts = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/v2/api/${API_PATH}/admin/products/all`
      );
      const productsArray = Object.values(res.data.products).map((product) => ({
        ...product,
        imagesUrl: Array.isArray(product.imagesUrl) ? product.imagesUrl : [],
      })); // 如果取得的產品列表，有產品裡面沒有 imagesUrl 屬性，就要增加 imagesUrl 屬性
      setProducts(productsArray); // 更新產品狀態
    } catch (error) {
      alert("無法獲取產品列表，請稍後再試");
      console.error("獲取產品列表錯誤：", error);
    }
  };

  // 登入驗證
  const checkUserLogin = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/v2/api/user/check`);
      fetchProducts();
      setIsAuth(true);
    } catch (error) {
      alert("使用者未登入");
      console.log("使用者未登入:", error);
    }
  };

  // 跳過登入流程直接取得 token 驗證登入
  useEffect(() => {
    const token = document.cookie.replace(
      // 從 cookie 取得 token
      /(?:(?:^|.*;\s*)hexToken\s*\=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    axios.defaults.headers.common["Authorization"] = token;
    checkUserLogin();
  }, []);

  // Modal
  const productModalRef = useRef(null);
  const delProductModalRef = useRef(null);
  // 更改新增或編輯產品狀態
  const [modalMode, setModalMode] = useState(null);
  // 建立 Modal 實例
  useEffect(() => {
    new Modal(productModalRef.current, {
      backdrop: false,
    });

    new Modal(delProductModalRef.current, {
      backdrop: false,
    });
  }, []);

  const handleOpenProductModal = (mode, product) => {
    setModalMode(mode);
    switch (mode) {
      case "create":
        setTempProduct(defaultModalState); // 如果 mode 是 create，將狀態更改為 defaultModalState
        break;

      case "edit":
        setTempProduct(product); // 如果 mode 是 edit，將狀態更改為顯示已有的產品資料
        break;

      default:
        break;
    }

    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.show();
  };

  const handleCloseProductModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.hide();
  };

  const handleOpenDelProductModal = (product) => {
    setTempProduct(product);

    const modalInstance = Modal.getInstance(delProductModalRef.current);
    modalInstance.show();
  };

  const handleCloseDelProductModal = () => {
    const modalInstance = Modal.getInstance(delProductModalRef.current);
    modalInstance.hide();
  };

  // 更新編輯的產品資料
  const [tempProduct, setTempProduct] = useState(defaultModalState);

  // 取得 modal 輸入框相應的值
  const handleModalInputChange = (e) => {
    const { value, name, checked, type } = e.target;
    setTempProduct({
      ...tempProduct,
      [name]: type === "checkbox" ? checked : value, // 如果 input 的 type 屬性是 checkbox，就回傳 checked 的值；否則回傳 value 的值
    });
  };

  // 取得新增圖片網址的值
  const handleImageChange = (e, index) => {
    const { value } = e.target;

    const newImages = [...tempProduct.imagesUrl];

    newImages[index] = value;

    setTempProduct({ ...tempProduct, imagesUrl: newImages });
  };

  // 將圖片網址的值更新至產品資料
  const handleAddImage = () => {
    const newImages = [...tempProduct.imagesUrl, ""];

    setTempProduct({ ...tempProduct, imagesUrl: newImages });
  };

  // 刪除產品資料內的圖片
  const handleRemoveImage = () => {
    const newImages = [...tempProduct.imagesUrl];

    newImages.pop();

    setTempProduct({ ...tempProduct, imagesUrl: newImages });
  };

  // 新增產品 API
  const createProduct = async () => {
    try {
      await axios.post(`${BASE_URL}/v2/api/${API_PATH}/admin/product`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0,
        },
      });
    } catch (error) {
      alert(`新增產品失敗：${error.response.data.message}`);
    }
  };

  // 編輯產品 API
  const updateProduct = async () => {
    try {
      await axios.put(
        `${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`,
        {
          data: {
            ...tempProduct,
            origin_price: Number(tempProduct.origin_price),
            price: Number(tempProduct.price),
            is_enabled: tempProduct.is_enabled ? 1 : 0,
          },
        }
      );
    } catch (error) {
      alert(`編輯產品失敗：${error.response.data.message}`);
    }
  };

  // 刪除產品 API
  const deleteProduct = async () => {
    try {
      await axios.delete(
        `${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`
      );
    } catch (error) {
      alert("刪除產品失敗");
    }
  };

  // 點擊新增或編輯產品確認按鈕
  const handleUpdateProduct = async () => {
    const apiCall = modalMode === "create" ? createProduct : updateProduct;

    try {
      await apiCall();
      fetchProducts();
      handleCloseProductModal();
    } catch (error) {
      alert("更新產品失敗");
    }
  };

  const handleDelProduct = async () => {
    try {
      await deleteProduct();
      fetchProducts();
      handleCloseDelProductModal();
    } catch (error) {
      alert("刪除產品失敗");
    }
  };

  return (
    <>
      {isAuth ? (
        <div className="container">
          <div className="row">
            <div className="col">
              <div className="d-flex justify-content-between">
                <h2 className="fw-bold">產品列表</h2>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    handleOpenProductModal("create");
                  }}
                >
                  建立新的產品
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">產品名稱</th>
                    <th scope="col">原價</th>
                    <th scope="col">售價</th>
                    <th scope="col">是否啟用</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <th scope="row">{product.title}</th>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td>
                        {product.is_enabled ? (
                          <span className="text-success">啟用</span>
                        ) : (
                          <span>未啟用</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => {
                              handleOpenProductModal("edit", product);
                            }}
                          >
                            編輯
                          </button>
                          <button
                            onClick={() => {
                              handleOpenDelProductModal(product);
                            }}
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100">
          <h1 className="mb-5">請先登入</h1>
          <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
            <div className="form-floating mb-3">
              <input
                name="username"
                value={account.username}
                onChange={handleInputChange}
                type="email"
                className="form-control"
                id="username"
                placeholder="name@example.com"
                required
              />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input
                name="password"
                value={account.password}
                onChange={handleInputChange}
                type="password"
                className="form-control"
                id="password"
                placeholder="Password"
                required
              />
              <label htmlFor="password">Password</label>
            </div>
            <button className="btn btn-dark">登入</button>
          </form>
          <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
        </div>
      )}

      {
        <div
          ref={productModalRef}
          className="modal"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fs-4">
                  {modalMode === "create" ? "新增產品" : "編輯產品"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleCloseProductModal}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-4">
                  <div className="col-md-4">
                    <div className="mb-4">
                      <label htmlFor="primary-image" className="form-label">
                        主圖
                      </label>
                      <div className="input-group">
                        <input
                          value={tempProduct.imageUrl}
                          onChange={handleModalInputChange}
                          name="imageUrl"
                          type="text"
                          id="primary-image"
                          className="form-control"
                          placeholder="請輸入圖片連結"
                        />
                      </div>
                      <img
                        src={tempProduct.imageUrl}
                        alt={tempProduct.title}
                        className="img-fluid"
                      />
                    </div>

                    {/* 副圖 */}
                    <div className="border border-2 border-dashed rounded-3 p-3">
                      {tempProduct.imagesUrl?.map((image, index) => (
                        <div key={index} className="mb-2">
                          <label
                            htmlFor={`imagesUrl-${index + 1}`}
                            className="form-label"
                          >
                            副圖 {index + 1}
                          </label>
                          <input
                            value={image}
                            onChange={(e) => {
                              handleImageChange(e, index);
                            }}
                            id={`imagesUrl-${index + 1}`}
                            type="text"
                            placeholder={`圖片網址 ${index + 1}`}
                            className="form-control mb-2"
                          />
                          {image && (
                            <img
                              src={image}
                              alt={`副圖 ${index + 1}`}
                              className="img-fluid mb-2"
                            />
                          )}
                        </div>
                      ))}

                      <div className="btn-group w-100">
                        {tempProduct.imagesUrl.length < 5 &&
                          tempProduct.imagesUrl[
                            tempProduct.imagesUrl.length - 1
                          ] !== "" && (
                            <button
                              onClick={handleAddImage}
                              className="btn btn-outline-primary btn-sm w-100"
                            >
                              新增圖片
                            </button>
                          )}

                        {tempProduct.imagesUrl.length >= 1 && (
                          <button
                            onClick={handleRemoveImage}
                            className="btn btn-outline-danger btn-sm w-100"
                          >
                            取消圖片
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">
                        標題
                      </label>
                      <input
                        value={tempProduct.title}
                        onChange={handleModalInputChange}
                        name="title"
                        id="title"
                        type="text"
                        className="form-control"
                        placeholder="請輸入標題"
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="category" className="form-label">
                        分類
                      </label>
                      <input
                        value={tempProduct.category}
                        onChange={handleModalInputChange}
                        name="category"
                        id="category"
                        type="text"
                        className="form-control"
                        placeholder="請輸入分類"
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="unit" className="form-label">
                        單位
                      </label>
                      <input
                        value={tempProduct.unit}
                        onChange={handleModalInputChange}
                        name="unit"
                        id="unit"
                        type="text"
                        className="form-control"
                        placeholder="請輸入單位"
                      />
                    </div>

                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label htmlFor="origin_price" className="form-label">
                          原價
                        </label>
                        <input
                          value={tempProduct.origin_price}
                          min="0"
                          onChange={handleModalInputChange}
                          name="origin_price"
                          id="origin_price"
                          type="number"
                          className="form-control"
                          placeholder="請輸入原價"
                        />
                      </div>
                      <div className="col-6">
                        <label htmlFor="price" className="form-label">
                          售價
                        </label>
                        <input
                          value={tempProduct.price}
                          min="0"
                          onChange={handleModalInputChange}
                          name="price"
                          id="price"
                          type="number"
                          className="form-control"
                          placeholder="請輸入售價"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">
                        產品描述
                      </label>
                      <textarea
                        value={tempProduct.description}
                        onChange={handleModalInputChange}
                        name="description"
                        id="description"
                        className="form-control"
                        rows={4}
                        placeholder="請輸入產品描述"
                      ></textarea>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">
                        說明內容
                      </label>
                      <textarea
                        value={tempProduct.content}
                        onChange={handleModalInputChange}
                        name="content"
                        id="content"
                        className="form-control"
                        rows={4}
                        placeholder="請輸入說明內容"
                      ></textarea>
                    </div>

                    <div className="form-check">
                      <input
                        checked={tempProduct.is_enabled}
                        onChange={handleModalInputChange}
                        name="is_enabled"
                        type="checkbox"
                        className="form-check-input"
                        id="isEnabled"
                      />
                      <label className="form-check-label" htmlFor="isEnabled">
                        是否啟用
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseProductModal}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateProduct}
                >
                  確認
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      {
        <div
          ref={delProductModalRef}
          className="modal fade"
          id="delProductModal"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h1 className="modal-title fs-5">刪除產品</h1>
                <button
                  onClick={handleCloseDelProductModal}
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                你是否要刪除
                <span className="text-danger fw-bold">{tempProduct.title}</span>
              </div>
              <div className="modal-footer">
                <button
                  onClick={handleCloseDelProductModal}
                  type="button"
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleDelProduct}
                  type="button"
                  className="btn btn-danger"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </>
  );
}

export default App;
