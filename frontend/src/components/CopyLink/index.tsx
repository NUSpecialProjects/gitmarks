import React from 'react';
import './styles.css';
import { FaRegCopy } from "react-icons/fa";
import GenericDropdown from '../Dropdown';

interface ICopyLinkProps {
    link: string;
    name: string;
    loading: boolean;
}

export interface IExpirationOption {
    label: string;
    value: number | undefined;
}

interface ICopyLinkWithExpirationProps extends ICopyLinkProps {
    duration: IExpirationOption | undefined;
    expirationOptions: IExpirationOption[];
    setDuration: (duration: IExpirationOption) => void;
}

export const CopyLinkWithExpiration: React.FC<ICopyLinkWithExpirationProps> = ({
    loading,
    link,
    name,
    duration,
    expirationOptions,
    setDuration
}) => {
    const copyLink = async() => {
        try {
            await navigator.clipboard.writeText(link);
            alert('Link copied to clipboard!');
        } catch (_) {
            alert('Error copying link, please try again.');
        }
    }

    const dropdownOptions = expirationOptions.map(option => ({
        value: option.value?.toString() ?? 'Never',
        label: option.label
    }));

    if (loading) {
        return <div className="CopyLink CopyLink--loading">
            <input id={name} type="text" value="" className="CopyLink__link loading-ellipsis" readOnly></input>
            {expirationOptions.length > 0 && (
                <div className="CopyLink__dropdownWrapper">
                    <GenericDropdown
                        options={dropdownOptions}
                        selectedOption={(duration?.value?.toString() ?? 'Never')}
                        onChange={() => {}}
                        loading={true}
                        labelText=""
                        placeholder="Expiration"
                        disabled={true}
                    />
                </div>
            )}
            <button className="CopyLink__copyButton" disabled><FaRegCopy /></button>
        </div>
    }

    return (
        <div className="CopyLink">
            <input id={name} type="text" value={link} className="CopyLink__link" readOnly></input>
            {expirationOptions.length > 0 && setDuration !== undefined && (
                <div className="CopyLink__dropdownWrapper">
                    <GenericDropdown
                        options={dropdownOptions}
                        selectedOption={(duration?.value?.toString() ?? 'Never')}
                        onChange={(value) => {
                            const option = expirationOptions.find(option => 
                                value === 'Never' ? option.value === undefined : option.value === Number(value)
                            );
                            if (option) {
                                setDuration(option);
                            }
                        }}
                        loading={false}
                        labelText=""
                        placeholder="Expiration"/>
                </div>
            )}
            <button onClick={copyLink} className="CopyLink__copyButton"><FaRegCopy /></button>
        </div>
    );
};

const CopyLink: React.FC<ICopyLinkProps> = ({
    loading,
    link,
    name
}) => {
    return <CopyLinkWithExpiration 
        link={link} 
        name={name} 
        duration={undefined} 
        setDuration={() => {}} 
        expirationOptions={[]}
        loading={loading}
    />;
}

export default CopyLink;