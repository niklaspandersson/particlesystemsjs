import React from "react";

type Props = {
  title: string;
  thumbUrl: string;
}

export const Thumbnail:React.FC<Props> = ({title, thumbUrl}) => {
  return  <figure>
            <img src={thumbUrl} alt="Thumbnail" />
            <figcaption>{title}</figcaption>
          </figure>
}