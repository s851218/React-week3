import { useState } from 'react'
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  const [isAuth, setIsAuth] = useState(false);

  const [tempProduct, setTempProduct] = useState({});
  const [products, setProducts] = useState([]);

  const [account, setAccount] = useState({
    "username": "example@test.com", // username 的初始值為 "example@test.com"。
    "password": "example", // password 的初始值為 "example"
  });

  const handleInputChange = (e) => {
    const { value, name } = e.target; // e.target 的物件解構，分別為 e.target.value 是輸入欄位的當前值；e.target.name 是該輸入欄位的 name 屬性，表示這是 username 還是 password。

    // setAccount 用於更新狀態。
    setAccount({
      ...account, // 展開運算符 ...account 產生新的 account 物件，用來保留現有的 account 狀態，不會直接改變原本的物件
      [name]: value, // [name]: value 動態地更新對應的欄位：如果 name 是 "username"，就更新 username 的值為 value；如果 name 是 "password"，就更新 password 的值為 value。
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();

    const login = async () => {
      try {
        const res = await axios.post(`${BASE_URL}/v2/admin/signin`, account);

        const { token, expired } = res.data; // 成功登入後，將 token 和 expired 取出來，要存到 cookie

        document.cookie = `hexToken=${token}; expires=${new Date(expired)}`; // 將 token 和 expired 存到 cookie

        axios.defaults.headers.common["Authorization"] = token; // 每次發送 HTTP 請求時，預設都會將這個 token 附加在 Authorization 標頭中

        setIsAuth(true); // 成功登入後，透過 setIsAuth 將 isAuth 狀態改成 true將 isAuth 狀態改成 true，就會渲染產品列表

        fetchProducts(); // 在登入成功後執行獲取產品列表函式
      } catch (error) {
        alert("登入失敗");
        console.log("登入失敗：", error);
      }
    };
    login();
  };

  // 獲取產品列表函式
  const fetchProducts = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/v2/api/${API_PATH}/admin/products/all`
      );
      // 轉換 products 為陣列
      const productsArray = Object.values(res.data.products);
      setProducts(productsArray); // 更新產品狀態
    } catch (error) {
      alert("無法獲取產品列表，請稍後再試");
      console.error("獲取產品列表錯誤：", error);
    }
  };

  const checkUserLogin = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/v2/api/user/check`);
      alert("使用者已登入");
    } catch (error) {
      alert("使用者未登入");
      console.log("使用者未登入:", err);
    }
  };

  return (
    <>
      {isAuth ? (
        <div className="container">
          <div className="row">
            <div className="col-6">
              <button onClick={checkUserLogin} className="btn btn-success my-3">
                檢查使用者是否登入
              </button>

              <h2 className="fw-bold">產品列表</h2>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">產品名稱</th>
                    <th scope="col">原價</th>
                    <th scope="col">售價</th>
                    <th scope="col">是否啟用</th>
                    <th scope="col">查看細節</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <th scope="row">{product.title}</th>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td>{product.is_enabled ? "啟用" : "未啟用"}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setTempProduct(product);
                          }}
                        >
                          查看細節
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="col-6">
              <h2 className="fw-bold mt-3">單一產品細節</h2>
              {tempProduct.title ? (
                <div className="card">
                  <img
                    src={tempProduct.imageUrl}
                    className="card-img-top"
                    alt="..."
                  />
                  <div className="card-body">
                    <h5 className="card-title fw-bold">
                      {tempProduct.title}
                      <span className="badge text-bg-primary ms-2">
                        {tempProduct.category}
                      </span>
                    </h5>
                    <p className="card-text">
                      商品描述：{tempProduct.description}
                    </p>
                    <p className="card-text">商品內容：{tempProduct.content}</p>
                    <p className="card-text">
                      <del>{tempProduct.origin_price}</del> /{" "}
                      {tempProduct.price} 元
                    </p>
                    <h5 className="card-title fw-bold">更多圖片：</h5>
                    {tempProduct.imagesUrl?.map((image, index) => {
                      return (
                        <img src={image} key={index} className="img-fluid" />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p>請選擇一個商品查看</p>
              )}
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
    </>
  );
}

export default App
