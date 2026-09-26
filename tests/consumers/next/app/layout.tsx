import '@meapri/prism-glass/styles.css';
import type {ReactNode} from 'react';
export default function Layout({children}:{children:ReactNode}){
  return <html lang="en"><body style={{margin:0,fontFamily:'system-ui'}}>{children}</body></html>;
}
