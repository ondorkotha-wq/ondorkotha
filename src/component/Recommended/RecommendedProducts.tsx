"use client"

import useFetchRecommendedProducts from "@/hooks/Products/Recommended/useFetchRecommendedProducts";
import LoadingDots from "../Loading/LoadingDS";
import ShowProductsFlex from "../ProductDisplay/ShowProductsFlex";

const RecommendedProducts = () => {
    const {products, isLoading} = useFetchRecommendedProducts({
        limit: 10
    })

    if(isLoading){
        <div>
            <LoadingDots/>
        </div>
    }

    return (
        <div>
            <ShowProductsFlex id="recommended" products={products} />
        </div>
    );
};

export default RecommendedProducts;