import { useEffect, useState } from "react";
import { fetchStubs } from "../../api/stubs/getStubs";


export interface StubProps {
    stub_id: string
    stub_content: string
}

const StubBanner : React.FC<StubProps> = ({stub_id, stub_content}) => {
    return (
        <div>{stub_id} {stub_content}</div>
    )
}


const Stub: React.FC = () => {
    const [stubs, setStubs] = useState<StubProps[]>([]);

    useEffect(() => {

        fetchStubs().then((stubArray) => {
          setStubs(stubArray)
      })
          
      }, []);

    return(
        <div>
            {stubs.map((stub) => (
  <StubBanner 
  stub_id={stub.stub_id} 
  stub_content={stub.stub_content}/>))}
        </div>
    )
} 

export default Stub;