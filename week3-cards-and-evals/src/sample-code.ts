/** 第 2 步接真实流式时可以用这段代码当输入，不要用公司代码。 */
export const SAMPLE_CODE_FOR_STREAM = `
function User({ id }) {
  if (!id) return null;
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch("/api/users/" + id).then((r) => r.json()).then(setUser);
  }, []);
  return <div>{user?.name}</div>;
}
`.trim();
